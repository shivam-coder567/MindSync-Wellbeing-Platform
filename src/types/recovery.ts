export type RecoveryStatus =
  | "not_started"
  | "in_progress"
  | "improving"
  | "completed";

export interface RecoveryGoal {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export interface RecoveryRecord {
  id: string;
  studentId: string;

  status: RecoveryStatus;

  moodAverage?: number;
  checkInCount: number;

  goals: RecoveryGoal[];

  lastUpdatedAt: string;
}
