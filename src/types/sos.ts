export type SOSStatus =
  | "triggered"
  | "contacting"
  | "connected"
  | "resolved"
  | "cancelled";

export type SOSSupportType =
  | "trusted_contact"
  | "professional"
  | "emergency_service";

export interface SOSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface SOSEvent {
  id: string;
  studentId: string;

  status: SOSStatus;
  supportType: SOSSupportType;

  location?: SOSLocation;

  trustedContactId?: string;
  professionalId?: string;

  triggeredAt: string;
  resolvedAt?: string;
}
