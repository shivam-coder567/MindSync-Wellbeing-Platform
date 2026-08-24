-- FIX: Create the missing booking/cancellation RPC functions.
--
-- These functions were defined in professional_support.sql but were never
-- applied to the live database because the migration's pre-flight guard
-- aborted (tables already existed from a partial manual setup). This script
-- uses CREATE OR REPLACE so it is safe to run even if the functions somehow
-- already exist.
--
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Fully idempotent and safe to re-run.

-- ── 1. book_student_appointment ─────────────────────────
-- Locks the requested slot, verifies availability, and inserts the appointment.
-- student_id is derived server-side from auth.uid() — never trusted from the client.

create or replace function public.book_student_appointment(
  p_professional_id uuid,
  p_professional_slot_id uuid,
  p_consultation_type text
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id text;
  v_slot public.professional_slots%rowtype;
  v_appointment public.appointments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to book a consultation.';
  end if;

  if p_consultation_type not in ('chat', 'audio', 'video') then
    raise exception 'Unsupported consultation type.';
  end if;

  select link.student_id into v_student_id
  from public.student_auth_accounts link
  where link.auth_user_id = auth.uid();

  if v_student_id is null then
    raise exception 'Your account is not linked to a student record.';
  end if;

  select slot.* into v_slot
  from public.professional_slots slot
  join public.professionals professional on professional.id = slot.professional_id
  where slot.id = p_professional_slot_id
    and professional.id = p_professional_id
    and slot.is_available
    and slot.starts_at > now()
    and professional.available
    and professional.verification_status = 'verified'
    and p_consultation_type = any(professional.consultation_types)
  for update of slot;

  if not found then
    raise exception 'This consultation time is no longer available.';
  end if;

  update public.professional_slots set is_available = false where id = v_slot.id;

  insert into public.appointments (
    student_id, professional_id, professional_slot_id,
    scheduled_at, ends_at, consultation_type
  ) values (
    v_student_id, v_slot.professional_id, v_slot.id,
    v_slot.starts_at, v_slot.ends_at, p_consultation_type
  ) returning * into v_appointment;

  return v_appointment;
end;
$$;

-- ── 2. cancel_student_appointment ───────────────────────
-- Students may cancel only their own future appointment.

create or replace function public.cancel_student_appointment(
  p_appointment_id uuid
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id text;
  v_appointment public.appointments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to cancel a consultation.';
  end if;

  select link.student_id into v_student_id
  from public.student_auth_accounts link
  where link.auth_user_id = auth.uid();

  select appointment.* into v_appointment
  from public.appointments appointment
  where appointment.id = p_appointment_id
    and appointment.student_id = v_student_id
    and appointment.status = 'upcoming'
    and appointment.scheduled_at > now()
  for update;

  if not found then
    raise exception 'This upcoming consultation could not be cancelled.';
  end if;

  update public.appointments
  set status = 'cancelled', cancelled_at = now()
  where id = v_appointment.id
  returning * into v_appointment;

  update public.professional_slots
  set is_available = true
  where id = v_appointment.professional_slot_id
    and starts_at > now();

  return v_appointment;
end;
$$;

-- ── 3. Permissions ──────────────────────────────────────
-- Revoke broad access, grant only to authenticated role.
-- Writes go through these security-definer functions only.

revoke all on function public.book_student_appointment(uuid, uuid, text) from public;
revoke all on function public.cancel_student_appointment(uuid) from public;
grant execute on function public.book_student_appointment(uuid, uuid, text) to authenticated;
grant execute on function public.cancel_student_appointment(uuid) to authenticated;

-- ── 4. Verification ─────────────────────────────────────
-- Run these after applying to confirm the functions exist:

-- select
--   routine_name,
--   security_type,
--   Routine_definition is not null as has_body
-- from information_schema.routines
-- where routine_schema = 'public'
--   and routine_name in ('book_student_appointment', 'cancel_student_appointment');
