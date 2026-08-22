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
-- is created: clients cannot write this table directly. New signups are linked
-- only through public.ensure_student_profile() below. Existing students can
-- still be linked in the SQL Editor.
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

-- Idempotent signup provisioning. Runs as the function owner so it can insert
-- the caller's mapping without adding INSERT policies (RLS stays SELECT-only
-- for clients). The caller can only provision auth.uid(); a successful call
-- does not grant access to any other student.
--
-- students.id must accept the Auth UUID (uuid or text). This does not alter
-- students or check_ins. Re-running this script replaces the function only.
create or replace function public.ensure_student_profile()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  linked_student_id text;
  student_name text;
  student_email text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select link.student_id
    into linked_student_id
  from public.student_auth_accounts as link
  where link.auth_user_id = uid;

  if linked_student_id is not null then
    return linked_student_id;
  end if;

  select
    coalesce(
      nullif(trim(account.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(split_part(account.email, '@', 1)), ''),
      'Student'
    ),
    account.email
  into student_name, student_email
  from auth.users as account
  where account.id = uid;

  begin
    insert into public.students (
      id,
      name,
      email,
      college,
      risk_level,
      avatar_type,
      avatar_value
    )
    values (
      uid,
      student_name,
      student_email,
      '',
      'low',
      'initials',
      null
    );
  exception
    when unique_violation then
      null;
  end;

  begin
    insert into public.student_auth_accounts (auth_user_id, student_id)
    values (uid, uid::text);
  exception
    when unique_violation then
      select link.student_id
        into linked_student_id
      from public.student_auth_accounts as link
      where link.auth_user_id = uid;

      if linked_student_id is not null then
        return linked_student_id;
      end if;

      raise;
  end;

  return uid::text;
end;
$$;

revoke all on function public.ensure_student_profile() from public;
grant execute on function public.ensure_student_profile() to authenticated;

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
