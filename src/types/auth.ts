export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  college: string;
  riskLevel: "low" | "medium" | "high";
  createdAt: string;
  avatarType?: "initials" | "avatar" | "photo";
  avatarValue?: string | null;
}
