-- Run once in your own Supabase SQL Editor. No passwords or keys belong here.
begin;

create table if not exists public.lab_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login text not null unique check (login ~ '^[a-z0-9][a-z0-9._-]{2,39}$'),
  display_name text not null check (char_length(display_name) between 1 and 120),
  role text not null check (role in ('teacher','student')),
  teacher_id uuid references public.lab_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check ((role='teacher' and teacher_id is null) or (role='student' and teacher_id is not null)),
  check (teacher_id is null or teacher_id <> id)
);

create table if not exists public.lab_progress (
  student_id uuid primary key references public.lab_profiles(id) on delete cascade,
  payload jsonb not null check (
    coalesce(jsonb_typeof(payload)='object' and payload->>'version'='1'
    and jsonb_typeof(payload->'answers')='object',false)
    and octet_length(payload::text) <= 4194304
  ),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_feedback (
  student_id uuid not null references public.lab_profiles(id) on delete cascade,
  task_id text not null check (task_id ~ '^(W[12]|P[1-6]|M[1-3])$'),
  teacher_id uuid not null default auth.uid() references public.lab_profiles(id),
  essay_text text not null check (char_length(essay_text) between 1 and 20000),
  content smallint check (content between 0 and 2),
  organization smallint check (organization between 0 and 2),
  language smallint check (language between 0 and 2),
  feedback text not null default '' check (char_length(feedback) <= 6000),
  updated_at timestamptz not null default now(),
  primary key (student_id,task_id)
);
create index if not exists lab_profiles_teacher_idx on public.lab_profiles(teacher_id);

alter table public.lab_profiles enable row level security;
alter table public.lab_progress enable row level security;
alter table public.lab_feedback enable row level security;

-- No anonymous access. Clients cannot create profiles or change role/teacher links.
revoke all on public.lab_profiles,public.lab_progress,public.lab_feedback from anon,authenticated;
grant select on public.lab_profiles to authenticated;
grant select,insert on public.lab_progress to authenticated;
grant update(payload) on public.lab_progress to authenticated;
grant select,insert,update on public.lab_feedback to authenticated;

drop policy if exists lab_profiles_read on public.lab_profiles;
create policy lab_profiles_read on public.lab_profiles for select to authenticated
using (id=(select auth.uid()) or teacher_id=(select auth.uid()));

drop policy if exists lab_progress_read on public.lab_progress;
create policy lab_progress_read on public.lab_progress for select to authenticated
using (student_id=(select auth.uid()) or exists (
  select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())
));

drop policy if exists lab_progress_insert on public.lab_progress;
create policy lab_progress_insert on public.lab_progress for insert to authenticated
with check (student_id=(select auth.uid()) and exists (
  select 1 from public.lab_profiles p where p.id=(select auth.uid()) and p.role='student'
));

drop policy if exists lab_progress_update on public.lab_progress;
create policy lab_progress_update on public.lab_progress for update to authenticated
using (student_id=(select auth.uid()) and exists (
  select 1 from public.lab_profiles p where p.id=(select auth.uid()) and p.role='student'
)) with check (student_id=(select auth.uid()));

drop policy if exists lab_feedback_read on public.lab_feedback;
create policy lab_feedback_read on public.lab_feedback for select to authenticated
using (student_id=(select auth.uid()) or exists (
  select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())
));

drop policy if exists lab_feedback_insert on public.lab_feedback;
create policy lab_feedback_insert on public.lab_feedback for insert to authenticated
with check (teacher_id=(select auth.uid()) and exists (
  select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())
));

drop policy if exists lab_feedback_update on public.lab_feedback;
create policy lab_feedback_update on public.lab_feedback for update to authenticated
using (exists (select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())))
with check (teacher_id=(select auth.uid()) and exists (
  select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())
));

create or replace function public.lab_stamp_progress()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' then
    new.revision=1;
    new.updated_at=now();
    return new;
  end if;
  new.student_id=old.student_id;
  new.revision=old.revision+1;
  new.updated_at=now();
  return new;
end $$;
drop trigger if exists lab_progress_stamp on public.lab_progress;
create trigger lab_progress_stamp before insert or update on public.lab_progress
for each row execute function public.lab_stamp_progress();

create or replace function public.lab_stamp_feedback()
returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists lab_feedback_stamp on public.lab_feedback;
create trigger lab_feedback_stamp before update on public.lab_feedback
for each row execute function public.lab_stamp_feedback();

-- Optimistic concurrency: an older device cannot silently overwrite a newer one.
create or replace function public.lab_save_progress(p_expected_revision bigint,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_row public.lab_progress; v_id uuid=auth.uid();
begin
  if v_id is null or not exists(select 1 from public.lab_profiles where id=v_id and role='student') then
    raise sqlstate '42501' using message='Student access required';
  end if;
  if p_expected_revision < 0 or p_expected_revision is null then
    raise sqlstate '22023' using message='Invalid revision';
  end if;
  if p_expected_revision=0 then
    insert into public.lab_progress(student_id,payload) values(v_id,p_payload)
      on conflict(student_id) do nothing returning * into v_row;
    if v_row.student_id is not null then
      return jsonb_build_object('revision',v_row.revision,'updated_at',v_row.updated_at);
    end if;
    raise sqlstate 'PT409' using message='Progress changed on another device';
  end if;
  select * into v_row from public.lab_progress where student_id=v_id for update;
  if not found or v_row.revision<>p_expected_revision then
    raise sqlstate 'PT409' using message='Progress changed on another device';
  end if;
  update public.lab_progress set payload=p_payload where student_id=v_id returning * into v_row;
  return jsonb_build_object('revision',v_row.revision,'updated_at',v_row.updated_at);
end $$;

revoke all on function public.lab_save_progress(bigint,jsonb) from public,anon;
grant execute on function public.lab_save_progress(bigint,jsonb) to authenticated;
revoke all on function public.lab_stamp_progress(),public.lab_stamp_feedback() from public,anon,authenticated;
commit;
