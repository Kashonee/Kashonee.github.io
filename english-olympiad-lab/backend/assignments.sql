-- Add after schema.sql. Teacher-created tasks and student-owned responses.
begin;
create table if not exists public.lab_assignments (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.lab_profiles(id) on delete cascade,
 teacher_id uuid not null default auth.uid() references public.lab_profiles(id),
 kind text not null check(kind in ('diagnostic','lesson','writing','custom')),
 title text not null check(char_length(title) between 1 and 160),
 instructions text not null default '' check(char_length(instructions)<=6000),
 target text not null default '' check(char_length(target)<=160),
 due_at timestamptz,
 archived boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.lab_assignment_submissions (
 assignment_id uuid primary key references public.lab_assignments(id) on delete cascade,
 student_id uuid not null default auth.uid() references public.lab_profiles(id) on delete cascade,
 response_text text not null default '' check(char_length(response_text)<=20000),
 completed boolean not null default false,
 updated_at timestamptz not null default now()
);
create index if not exists lab_assignments_student_idx on public.lab_assignments(student_id);
alter table public.lab_assignments enable row level security;
alter table public.lab_assignment_submissions enable row level security;
revoke all on public.lab_assignments,public.lab_assignment_submissions from anon,authenticated;
grant select,insert,update on public.lab_assignments to authenticated;
grant select,insert,update on public.lab_assignment_submissions to authenticated;
drop policy if exists lab_assignments_read on public.lab_assignments;
create policy lab_assignments_read on public.lab_assignments for select to authenticated
using(student_id=(select auth.uid()) or teacher_id=(select auth.uid()) and exists(select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())));
drop policy if exists lab_assignments_insert on public.lab_assignments;
create policy lab_assignments_insert on public.lab_assignments for insert to authenticated
with check(teacher_id=(select auth.uid()) and exists(select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())));
drop policy if exists lab_assignments_update on public.lab_assignments;
create policy lab_assignments_update on public.lab_assignments for update to authenticated
using(teacher_id=(select auth.uid()) and exists(select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())))
with check(teacher_id=(select auth.uid()) and exists(select 1 from public.lab_profiles p where p.id=student_id and p.teacher_id=(select auth.uid())));
drop policy if exists lab_submissions_read on public.lab_assignment_submissions;
create policy lab_submissions_read on public.lab_assignment_submissions for select to authenticated
using(student_id=(select auth.uid()) or exists(select 1 from public.lab_assignments a join public.lab_profiles p on p.id=a.student_id where a.id=assignment_id and a.teacher_id=(select auth.uid()) and p.teacher_id=(select auth.uid())));
drop policy if exists lab_submissions_insert on public.lab_assignment_submissions;
create policy lab_submissions_insert on public.lab_assignment_submissions for insert to authenticated
with check(student_id=(select auth.uid()) and exists(select 1 from public.lab_assignments a where a.id=assignment_id and a.student_id=(select auth.uid()) and not a.archived));
drop policy if exists lab_submissions_update on public.lab_assignment_submissions;
create policy lab_submissions_update on public.lab_assignment_submissions for update to authenticated
using(student_id=(select auth.uid()))
with check(student_id=(select auth.uid()) and exists(select 1 from public.lab_assignments a where a.id=assignment_id and a.student_id=(select auth.uid()) and not a.archived));
drop trigger if exists lab_submission_stamp on public.lab_assignment_submissions;
create trigger lab_submission_stamp before insert or update on public.lab_assignment_submissions
for each row execute function public.lab_stamp_feedback();
commit;
