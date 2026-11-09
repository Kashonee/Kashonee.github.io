-- Additive migration. Run AFTER schema.sql. No existing pupil records are changed.
begin;
create table if not exists public.lab_ai_reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.lab_profiles(id) on delete cascade,
  task_id text not null check (task_id ~ '^(W[12]|P[1-6]|M[1-3])$'),
  essay_hash text not null check (essay_hash ~ '^[a-f0-9]{64}$'),
  essay_text text not null check (char_length(essay_text) between 1 and 12000),
  prompt_version text not null check (char_length(prompt_version) between 1 and 80),
  result jsonb not null check (jsonb_typeof(result)='object' and octet_length(result::text)<=65536),
  model text not null check (char_length(model) between 1 and 100),
  created_at timestamptz not null default now(),
  unique(student_id,task_id,essay_hash,prompt_version)
);
create table if not exists public.lab_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.lab_profiles(id) on delete cascade,
  requester_id uuid not null references public.lab_profiles(id) on delete cascade,
  task_id text not null check (task_id ~ '^(W[12]|P[1-6]|M[1-3])$'),
  essay_hash text not null check (essay_hash ~ '^[a-f0-9]{64}$'),
  essay_text text not null check (char_length(essay_text) between 1 and 12000),
  prompt_version text not null check (char_length(prompt_version) between 1 and 80),
  status text not null default 'processing' check (status in ('processing','completed','failed')),
  created_at timestamptz not null default now()
);
create index if not exists lab_ai_jobs_student_date on public.lab_ai_jobs(student_id,created_at);
create index if not exists lab_ai_jobs_date on public.lab_ai_jobs(created_at);
create index if not exists lab_ai_reviews_student_date on public.lab_ai_reviews(student_id,created_at desc);
alter table public.lab_ai_reviews enable row level security;
alter table public.lab_ai_jobs enable row level security;
revoke all on public.lab_ai_reviews,public.lab_ai_jobs from anon,authenticated;
grant select on public.lab_ai_reviews to authenticated;
grant select,insert,update on public.lab_ai_reviews,public.lab_ai_jobs to service_role;
drop policy if exists lab_ai_reviews_read on public.lab_ai_reviews;
create policy lab_ai_reviews_read on public.lab_ai_reviews for select to authenticated using (
  student_id=(select auth.uid()) or exists (
    select 1 from public.lab_profiles p join public.lab_profiles t on t.id=p.teacher_id
    where p.id=student_id and p.teacher_id=(select auth.uid()) and t.role='teacher'
  )
);

-- Only the authenticated Edge Function's server client can reserve paid work.
-- A single short transaction serializes quota checks across instances.
create or replace function public.lab_ai_claim(
  p_student_id uuid,p_requester_id uuid,p_task_id text,p_essay_hash text,p_essay_text text,p_prompt_version text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_payload jsonb; v_text text; v_review public.lab_ai_reviews; v_job uuid;
begin
  if not exists(
    select 1 from public.lab_profiles s join public.lab_profiles a on a.id=p_requester_id
    where s.id=p_student_id and s.role='student' and
      ((a.id=s.id and a.role='student') or (a.id=s.teacher_id and a.role='teacher'))
  ) then raise sqlstate '42501' using message='Access denied'; end if;
  if p_task_id !~ '^(W[12]|P[1-6]|M[1-3])$' or p_essay_hash !~ '^[a-f0-9]{64}$'
    or p_prompt_version is null or char_length(p_prompt_version) not between 1 and 80
    or p_essay_text is null or char_length(p_essay_text) not between 1 and 12000 then
    return jsonb_build_object('status','invalid');
  end if;
  select payload into v_payload from public.lab_progress where student_id=p_student_id;
  if p_task_id like 'W%' then
    if not coalesce(v_payload->'completeBlocks' @> '[1,2,3,4]'::jsonb,false) then
      return jsonb_build_object('status','not_submitted');
    end if;
    v_text=v_payload->'writing'->p_task_id->>'text';
  elsif p_task_id like 'M%' then
    if not coalesce(v_payload->'exercises'->p_task_id->'submitted'='true'::jsonb,false) then
      return jsonb_build_object('status','not_submitted');
    end if;
    v_text=v_payload->'exercises'->p_task_id->>'text';
  else v_text=v_payload->'drafts'->p_task_id->>'text'; end if;
  if v_text is distinct from p_essay_text then return jsonb_build_object('status','changed'); end if;
  perform pg_catalog.pg_advisory_xact_lock(947213826017::bigint);
  select * into v_review from public.lab_ai_reviews where student_id=p_student_id and task_id=p_task_id
    and essay_hash=p_essay_hash and prompt_version=p_prompt_version and essay_text=p_essay_text;
  if found then return jsonb_build_object('status','cached','review_id',v_review.id); end if;
  if exists(select 1 from public.lab_ai_jobs where student_id=p_student_id and
    status='processing' and created_at>now()-interval '2 minutes') then
    return jsonb_build_object('status','busy');
  end if;
  if (select count(*) from public.lab_ai_jobs where student_id=p_student_id and created_at>now()-interval '24 hours')>=6 then
    return jsonb_build_object('status','daily_limit');
  end if;
  if (select count(*) from public.lab_ai_jobs where created_at>now()-interval '24 hours')>=50 then
    return jsonb_build_object('status','global_limit');
  end if;
  if exists(select 1 from public.lab_ai_jobs where student_id=p_student_id and created_at>now()-interval '1 minute') then
    return jsonb_build_object('status','cooldown');
  end if;
  insert into public.lab_ai_jobs(student_id,requester_id,task_id,essay_hash,essay_text,prompt_version)
    values(p_student_id,p_requester_id,p_task_id,p_essay_hash,p_essay_text,p_prompt_version) returning id into v_job;
  return jsonb_build_object('status','claimed','job_id',v_job);
end $$;

create or replace function public.lab_ai_finish(p_job_id uuid,p_result jsonb,p_model text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_job public.lab_ai_jobs; v_id uuid;
begin
  select * into v_job from public.lab_ai_jobs where id=p_job_id for update;
  if not found or v_job.status<>'processing' then raise exception 'Job not available'; end if;
  insert into public.lab_ai_reviews(student_id,task_id,essay_hash,essay_text,prompt_version,result,model)
    values(v_job.student_id,v_job.task_id,v_job.essay_hash,v_job.essay_text,v_job.prompt_version,p_result,p_model)
    on conflict(student_id,task_id,essay_hash,prompt_version) do nothing;
  select id into v_id from public.lab_ai_reviews where student_id=v_job.student_id and task_id=v_job.task_id
    and essay_hash=v_job.essay_hash and prompt_version=v_job.prompt_version;
  update public.lab_ai_jobs set status='completed' where id=p_job_id;
  return v_id;
end $$;
revoke all on function public.lab_ai_claim(uuid,uuid,text,text,text,text),public.lab_ai_finish(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.lab_ai_claim(uuid,uuid,text,text,text,text),public.lab_ai_finish(uuid,jsonb,text) to service_role;
commit;
