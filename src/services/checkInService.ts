import { supabase } from "../supabaseClient";

export type CheckInRecord = {
  id: string;
  mood: number;
  stressLevel: number;
  anxietyLevel: number;
  createdAt: string;
};

type CheckInRow = {
  id: string;
  mood: number;
  stress_level: number;
  anxiety_level: number;
  created_at: string;
};

export async function getStudentCheckIns(studentId: string): Promise<CheckInRecord[]> {
  const { data, error } = await supabase
    .from("check_ins")
    .select("id, mood, stress_level, anxiety_level, created_at")
    .eq("student_id", studentId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;

  return ((data || []) as CheckInRow[]).map((row) => ({
    id: row.id,
    mood: row.mood,
    stressLevel: row.stress_level,
    anxietyLevel: row.anxiety_level,
    createdAt: row.created_at,
  }));
}
