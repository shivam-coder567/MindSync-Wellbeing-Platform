-- Fix: Grant SELECT on professional-support tables to authenticated role.
--
-- The professional_support.sql migration was never fully applied — the tables
-- exist but the GRANT statements and RLS policies were never executed.
-- This causes PostgREST error 42501 ("permission denied for table professionals")
-- because the authenticated role cannot even reach the RLS policy evaluation.
--
-- Run this entire block in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is fully idempotent: safe to re-run.

-- ── 1. Table-level GRANTs ────────────────────────────────
-- Authenticated users need SELECT to read the directory, slots, and their own
-- appointments. All INSERT/UPDATE/DELETE is intentionally denied: writes go
-- through security-definer RPCs only.

grant select on public.professionals to authenticated;
grant select on public.professional_slots to authenticated;
grant select on public.appointments to authenticated;

-- ── 2. RLS policies ──────────────────────────────────────
-- These policies filter WHICH rows each role can see. They are only evaluated
-- after the GRANT above allows the role to reach the table.

-- Professionals: only show verified professionals to signed-in students.
create policy "Authenticated students can view verified professionals"
  on public.professionals for select to authenticated
  using (verification_status = 'verified');

-- Slots: only show available, future slots for verified professionals.
create policy "Authenticated students can view future slots for verified professionals"
  on public.professional_slots for select to authenticated
  using (
    is_available
    and starts_at > now()
    and exists (
      select 1 from public.professionals professional
      where professional.id = professional_slots.professional_id
        and professional.verification_status = 'verified'
    )
  );

-- Appointments: students can only see their own appointments.
create policy "Students can view only their own appointments"
  on public.appointments for select to authenticated
  using (
    exists (
      select 1 from public.student_auth_accounts link
      where link.auth_user_id = auth.uid()
        and link.student_id = appointments.student_id
    )
  );

-- ── 3. Verification queries ──────────────────────────────
-- Run these AFTER the statements above to confirm everything is correct.

-- Check grants:
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('professionals', 'professional_slots', 'appointments')
  and grantee = 'authenticated'
order by table_name, privilege_type;

-- Check RLS policies:
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual is not null as has_using
from pg_policies
where schemaname = 'public'
  and tablename in ('professionals', 'professional_slots', 'appointments')
order by tablename, policyname;

-- Check RLS is enabled:
select
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('professionals', 'professional_slots', 'appointments');

-- Check the verified professional is visible:
select id, name, verification_status, available
from public.professionals
where verification_status = 'verified';
