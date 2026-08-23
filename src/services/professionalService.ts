import { supabase } from "../supabaseClient";
import type { Appointment, ProfessionalSlot } from "../types/appointment";
import type {
  ConsultationType,
  Professional,
  ProfessionalRole,
  VerificationStatus,
} from "../types/professional";

type ProfessionalRow = {
  id: string;
  name: string;
  role: ProfessionalRole;
  specialization: string;
  verification_status: VerificationStatus;
  city: string;
  available: boolean;
  consultation_types: ConsultationType[] | null;
  created_at: string;
};

type SlotRow = {
  id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
};

type AppointmentRow = {
  id: string;
  student_id: string;
  professional_id: string;
  professional_slot_id: string;
  scheduled_at: string;
  ends_at: string;
  consultation_type: ConsultationType;
  status: Appointment["status"];
  cancelled_at: string | null;
  created_at: string;
};

export class ProfessionalSupportUnavailableError extends Error {
  constructor() {
    super(
      "Professional support is not connected in this environment yet. Please check back once the secure directory has been configured.",
    );
    this.name = "ProfessionalSupportUnavailableError";
  }
}

function isMissingTable(error: { code?: string } | null) {
  return error?.code === "42P01";
}

function throwServiceError(error: { code?: string; message?: string }) {
  if (isMissingTable(error)) throw new ProfessionalSupportUnavailableError();
  throw error;
}

function toProfessional(row: ProfessionalRow): Professional {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    specialization: row.specialization,
    verificationStatus: row.verification_status,
    city: row.city,
    available: row.available,
    consultationTypes: row.consultation_types || [],
    createdAt: row.created_at,
  };
}

function toSlot(row: SlotRow): ProfessionalSlot {
  return {
    id: row.id,
    professionalId: row.professional_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    studentId: row.student_id,
    professionalId: row.professional_id,
    professionalSlotId: row.professional_slot_id,
    scheduledAt: row.scheduled_at,
    endsAt: row.ends_at,
    consultationType: row.consultation_type,
    status: row.status,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
  };
}

export async function getProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, name, role, specialization, verification_status, city, available, consultation_types, created_at",
    )
    .order("name", { ascending: true });

  if (error) throwServiceError(error);
  return ((data || []) as ProfessionalRow[]).map(toProfessional);
}

export async function getProfessional(
  professionalId: string,
): Promise<Professional | null> {
  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, name, role, specialization, verification_status, city, available, consultation_types, created_at",
    )
    .eq("id", professionalId)
    .maybeSingle();

  if (error) throwServiceError(error);
  return data ? toProfessional(data as ProfessionalRow) : null;
}

export async function getProfessionalSlots(
  professionalId: string,
): Promise<ProfessionalSlot[]> {
  const { data, error } = await supabase
    .from("professional_slots")
    .select("id, professional_id, starts_at, ends_at")
    .eq("professional_id", professionalId)
    .eq("is_available", true)
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) throwServiceError(error);
  return ((data || []) as SlotRow[]).map(toSlot);
}

export async function getStudentAppointments(
  studentId: string,
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, student_id, professional_id, professional_slot_id, scheduled_at, ends_at, consultation_type, status, cancelled_at, created_at",
    )
    .eq("student_id", studentId)
    .order("scheduled_at", { ascending: true });

  if (error) throwServiceError(error);
  return ((data || []) as AppointmentRow[]).map(toAppointment);
}

export async function getStudentAppointment(
  studentId: string,
  appointmentId: string,
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, student_id, professional_id, professional_slot_id, scheduled_at, ends_at, consultation_type, status, cancelled_at, created_at",
    )
    .eq("student_id", studentId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) throwServiceError(error);
  return data ? toAppointment(data as AppointmentRow) : null;
}

export async function bookAppointment(
  professionalId: string,
  slotId: string,
  consultationType: ConsultationType,
): Promise<Appointment> {
  const { data, error } = await supabase.rpc("book_student_appointment", {
    p_professional_id: professionalId,
    p_professional_slot_id: slotId,
    p_consultation_type: consultationType,
  });

  if (error) throwServiceError(error);
  return toAppointment(data as AppointmentRow);
}

export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  const { data, error } = await supabase.rpc("cancel_student_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) throwServiceError(error);
  return toAppointment(data as AppointmentRow);
}
