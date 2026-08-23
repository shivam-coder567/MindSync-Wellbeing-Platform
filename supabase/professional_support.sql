-- Professional support and appointments
--
-- This migration is intentionally fail-safe. The MindSync repository has no
-- existing professionals, professional_slots, or appointments schema. If a
-- live table with any of these names already exists, this script stops before
-- changing it so its actual structure can be reviewed first.
--
-- Prerequisite: public.students.id and public.student_auth_accounts.student_id
-- use the existing text student identifier established in Phase 1.

do $$
begin
  if to_regclass('public.professionals') is not null
     or to_regclass('public.professional_slots') is not null
     or to_regclass('public.appointments') is not null then
    raise exception 'Professional-support tables already exist. Review their live schema before applying this migration.';
  end if;
end $$;

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('psychiatrist', 'psychologist', 'counselor')),
  specialization text not null,
  city text not null,
  overview text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  available boolean not null default false,
  consultation_types text[] not null default array['chat', 'audio', 'video']::text[]
    check (consultation_types <@ array['chat', 'audio', 'video']::text[]),
  created_at timestamptz not null default now()
);

create table public.professional_slots (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  constraint professional_slot_window_valid check (ends_at > starts_at),
  constraint unique_professional_slot unique (professional_id, starts_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  professional_slot_id uuid not null unique references public.professional_slots(id) on delete restrict,
  scheduled_at timestamptz not null,
  ends_at timestamptz not null,
  consultation_type text not null check (consultation_type in ('chat', 'audio', 'video')),
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint appointment_window_valid check (ends_at > scheduled_at)
);

create index appointments_student_schedule_idx on public.appointments (student_id, scheduled_at);
create index professional_slots_available_idx on public.professional_slots (professional_id, starts_at) where is_available;

alter table public.professionals enable row level security;
alter table public.professional_slots enable row level security;
alter table public.appointments enable row level security;

-- Do not let anon, PUBLIC, or a generally authenticated client write these
-- tables. Directory rows and future open slots are intentionally readable only
-- by signed-in students. Appointment writes go through the two RPCs below.
revoke all on public.professionals from public, anon, authenticated;
revoke all on public.professional_slots from public, anon, authenticated;
revoke all on public.appointments from public, anon, authenticated;
grant select on public.professionals to authenticated;
grant select on public.professional_slots to authenticated;
grant select on public.appointments to authenticated;

create policy "Authenticated students can view verified professionals"
  on public.professionals for select to authenticated
  using (verification_status = 'verified');

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

create policy "Students can view only their own appointments"
  on public.appointments for select to authenticated
  using (
    exists (
      select 1 from public.student_auth_accounts link
      where link.auth_user_id = auth.uid()
        and link.student_id = appointments.student_id
    )
  );

-- Booking locks one live slot and derives student_id from auth.uid(), rather
-- than trusting browser-provided student information. The unique slot FK plus
-- row lock prevents two students from booking the same time.
create function public.book_student_appointment(
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
    student_id, professional_id, professional_slot_id, scheduled_at, ends_at, consultation_type
  ) values (
    v_student_id, v_slot.professional_id, v_slot.id, v_slot.starts_at, v_slot.ends_at, p_consultation_type
  ) returning * into v_appointment;

  return v_appointment;
end;
$$;

-- Students may cancel only their own future appointment. They cannot mark an
-- appointment completed or edit its professional, time, or another student.
create function public.cancel_student_appointment(p_appointment_id uuid)
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
  where id = v_appointment.professional_slot_id and starts_at > now();

  return v_appointment;
end;
$$;

revoke all on function public.book_student_appointment(uuid, uuid, text) from public;
revoke all on function public.cancel_student_appointment(uuid) from public;
grant execute on function public.book_student_appointment(uuid, uuid, text) to authenticated;
grant execute on function public.cancel_student_appointment(uuid) to authenticated;
