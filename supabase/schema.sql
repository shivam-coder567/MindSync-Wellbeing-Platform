-- Phase 1: non-destructive Auth-to-student mapping
--
-- Run this only after reviewing the existing public.students and public.check_ins
-- columns in the Supabase dashboard. This script does NOT alter or delete either
-- existing table. It adds a private mapping from one Auth account to one existing
-- student record, whatever textual form the existing student id uses.

create table if not exists public.student_auth_accounts (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  student_id text not null unique,
  linked_at timestamptz not null default now()
);

alter table public.student_auth_accounts enable row level security;

-- A student may see only their own mapping. No INSERT, UPDATE, or DELETE policy
-- is created: links are managed deliberately in the Supabase SQL Editor.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'student_auth_accounts'
      and policyname = 'Students can view their own auth mapping'
  ) then
    execute 'create policy "Students can view their own auth mapping" on public.student_auth_accounts for select using (auth.uid() = auth_user_id)';
  end if;
end $$;

-- Required RLS policy shape for the existing tables. Review current policies
-- first. Add an equivalent policy only if one does not already enforce this.
-- Keep RLS enabled and remove any broad anon/authenticated read policy separately.
--
-- students SELECT:
-- exists (
--   select 1 from public.student_auth_accounts link
--   where link.auth_user_id = auth.uid()
--     and link.student_id = public.students.id::text
-- )
--
-- check_ins SELECT / INSERT / UPDATE:
-- exists (
--   select 1 from public.student_auth_accounts link
--   where link.auth_user_id = auth.uid()
--     and link.student_id = public.check_ins.student_id::text
-- )

-- Link the existing Auth user to its existing student record after you identify
-- both IDs in Supabase. Replace the values below; do not run this example as-is.
-- insert into public.student_auth_accounts (auth_user_id, student_id)
-- values ('AUTH_USER_UUID', 'EXISTING_STUDENT_ID');
