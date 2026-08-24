/**
 * wellnessService.ts
 *
 * Supabase queries for the Wellness Monitor.
 * Fetches check-in data and appointment history for trend analysis.
 */

import { supabase } from "../supabaseClient";
import type { WellnessRecord } from "../types/wellness";

type CheckInRow = {
  id: string;
  mood: number;
  stress_level: number;
  anxiety_level: number;
  note: string | null;
  created_at: string;
};

/**
 * Fetch all completed check-ins for a student, ordered oldest first.
 * Limited to 60 records to keep the query efficient.
 */
export async function getWellnessRecords(
  studentId: string,
): Promise<WellnessRecord[]> {
  const { data, error } = await supabase
    .from("check_ins")
    .select("id, mood, stress_level, anxiety_level, note, created_at")
    .eq("student_id", studentId)
    .eq("status", "completed")
    .order("created_at", { ascending: true })
    .limit(60);

  if (error) throw error;

  return ((data || []) as CheckInRow[]).map((row) => ({
    id: row.id,
    mood: row.mood,
    stressLevel: row.stress_level,
    anxietyLevel: row.anxiety_level,
    note: row.note || "",
    createdAt: row.created_at,
  }));
}
