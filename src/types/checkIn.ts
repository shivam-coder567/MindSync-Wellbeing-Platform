export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type CheckInStatus = "completed" | "skipped";

export interface CheckIn {
  id: string;
  studentId: string;

  mood: MoodLevel;
  stressLevel: MoodLevel;
  anxietyLevel: MoodLevel;

  note?: string;

  status: CheckInStatus;
  createdAt: string;
}
