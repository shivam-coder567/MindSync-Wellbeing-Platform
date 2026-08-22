export type RiskLevel = "low" | "medium" | "high";

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  location: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  college: string;
  riskLevel: RiskLevel;
  trustedContacts: TrustedContact[];
  createdAt: string;
}
