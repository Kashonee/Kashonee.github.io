-- Run in SQL Editor after schema.sql and accounts.sql. All probe writes roll back.
-- This checks the actual hosted RLS policies; it does not test Auth passwords.
begin;
do $$
declare
  s uuid; t uuid; old_revision bigint; v_payload jsonb; result jsonb;
  denied boolean; changed integer;
begin
  select id,teacher_id into s,t from public.lab_profiles where role='student' order by created_at limit 1;
  if s is null then raise exception 'Create and link a student first'; end if;

  perform set_config('request.jwt.claim.sub',s::text,true);
  execute 'set local role authenticated';
  assert (select count(*) from public.lab_profiles)=1,'Student must see only their profile';
  assert not exists(select 1 from public.lab_progress where student_id<>s),'Student read another result';
  denied=false;
  begin update public.lab_profiles set role='teacher' where id=s;
  exception when insufficient_privilege then denied=true; end;
  assert denied,'Student was able to change their role';
  denied=false;
  begin insert into public.lab_feedback(student_id,task_id,teacher_id,essay_text,content)
    values(s,'W1',s,'RLS probe',2)
    on conflict(student_id,task_id) do update set content=2;
  exception when insufficient_privilege then denied=true; end;
  assert denied,'Student was able to write a teacher grade';

  select revision,lab_progress.payload into old_revision,v_payload from public.lab_progress where student_id=s;
  old_revision=coalesce(old_revision,0);
  v_payload=coalesce(v_payload,'{"version":1,"answers":{}}'::jsonb);
  result=public.lab_save_progress(old_revision,v_payload);
  assert (result->>'revision')::bigint=old_revision+1,'Student progress write was not applied';
  denied=false;
  begin perform public.lab_save_progress(old_revision,v_payload);
  exception when sqlstate 'PT409' then denied=true; end;
  assert denied,'Stale device write was not rejected';

  execute 'reset role';
  perform set_config('request.jwt.claim.sub',t::text,true);
  execute 'set local role authenticated';
  assert exists(select 1 from public.lab_progress where student_id=s),'Teacher cannot read assigned student';
  denied=false;
  begin perform public.lab_save_progress(0,v_payload);
  exception when insufficient_privilege then denied=true; end;
  assert denied,'Teacher wrote progress through the student RPC';
  update public.lab_progress set payload=v_payload where student_id=s;
  get diagnostics changed=row_count;
  assert changed=0,'Teacher changed student answers';
  insert into public.lab_feedback(student_id,task_id,teacher_id,essay_text,content,organization,language,feedback)
    values(s,'W1',t,'RLS probe',2,1,1,'Verification only; transaction will roll back')
    on conflict(student_id,task_id) do update set teacher_id=t,essay_text='RLS probe',content=2,organization=1,language=1;
  assert exists(select 1 from public.lab_feedback where student_id=s and task_id='W1' and essay_text='RLS probe'),'Teacher write did not persist';

  execute 'reset role';
  perform set_config('request.jwt.claim.sub',s::text,true);
  execute 'set local role authenticated';
  assert exists(select 1 from public.lab_feedback where student_id=s and task_id='W1' and content=2),'Student cannot read teacher feedback';
  update public.lab_feedback set content=0 where student_id=s and task_id='W1';
  get diagnostics changed=row_count;
  assert changed=0,'Student changed a teacher grade';

  execute 'reset role';
  perform set_config('request.jwt.claim.sub','',true);
  execute 'set local role anon';
  denied=false;
  begin perform count(*) from public.lab_progress;
  exception when insufficient_privilege then denied=true; end;
  assert denied,'Anonymous progress access was allowed';
  execute 'reset role';
  raise notice 'RLS checks passed for the selected teacher/student pair. Probe writes are rolled back.';
end $$;
rollback;
