-- First create two confirmed users in Authentication > Users > Add user.
-- Their email aliases must match these two login names + @olympiad-lab.invalid.
-- Set their passwords privately in Supabase. Never put passwords into this file.
-- Edit the four values below if you prefer other logins or display names.
do $$
declare
  teacher_login text='teacher';
  student_login text='student';
  teacher_display text='Мұғалім';
  student_display text='Оқушы';
  teacher_uuid uuid;
  student_uuid uuid;
begin
  select id into teacher_uuid from auth.users where lower(email)=teacher_login||'@olympiad-lab.invalid';
  select id into student_uuid from auth.users where lower(email)=student_login||'@olympiad-lab.invalid';
  if teacher_uuid is null or student_uuid is null then
    raise exception 'Create both confirmed Auth users first: teacher@olympiad-lab.invalid and student@olympiad-lab.invalid (or edit the logins in this script)';
  end if;
  if teacher_uuid=student_uuid then raise exception 'Use two different users'; end if;
  insert into public.lab_profiles(id,login,display_name,role,teacher_id)
    values(teacher_uuid,teacher_login,teacher_display,'teacher',null)
    on conflict(id) do update set login=excluded.login,display_name=excluded.display_name,role='teacher',teacher_id=null;
  insert into public.lab_profiles(id,login,display_name,role,teacher_id)
    values(student_uuid,student_login,student_display,'student',teacher_uuid)
    on conflict(id) do update set login=excluded.login,display_name=excluded.display_name,role='student',teacher_id=teacher_uuid;
end $$;
