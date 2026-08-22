export type ProfessionalRole = "psychiatrist" | "psychologist" | "counselor";

export type VerificationStatus = "pending" | "verified" | "rejected";

export interface Professional {
  id: string;
  name: string;
  role: ProfessionalRole;
  specialization: string;

  verificationStatus: VerificationStatus;

  city: string;
  available: boolean;
  overview?: string | null;
  consultationTypes?: ConsultationType[];

  createdAt: string;
}

export type ConsultationType = "chat" | "audio" | "video";
