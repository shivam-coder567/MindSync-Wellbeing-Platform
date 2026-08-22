import type { ConsultationType } from "./professional";

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  studentId: string;
  professionalId: string;
  professionalSlotId: string;
  scheduledAt: string;
  endsAt: string;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  cancelledAt: string | null;
  createdAt: string;
}

export interface ProfessionalSlot {
  id: string;
  professionalId: string;
  startsAt: string;
  endsAt: string;
}
