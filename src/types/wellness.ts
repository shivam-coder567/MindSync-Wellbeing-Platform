/* ── Wellness Monitor types ───────────────────────────────────── */

export type TrendDirection = "improving" | "stable" | "declining" | "mixed";
export type TrendStrength = "minimal" | "slight" | "moderate" | "noticeable";
export type InsightState = "sufficient" | "insufficient" | "error";

export interface WellnessRecord {
  id: string;
  mood: number;
  stressLevel: number;
  anxietyLevel: number;
  note: string;
  createdAt: string;
}

export interface PersonalBaseline {
  mood: number;
  stress: number;
  anxiety: number;
  count: number;
  daysCovered: number;
}

export interface MetricTrend {
  current: number | null;
  baseline: number | null;
  direction: TrendDirection;
  strength: TrendStrength;
  changePercent: number | null;
  label: string;
  icon: string;
}

export interface WellnessInsight {
  headline: string;
  body: string;
  suggestion: string;
  state: "positive" | "neutral" | "supportive" | "escalation";
}

export interface WellnessSnapshot {
  baseline: PersonalBaseline | null;
  recent7: WellnessRecord[];
  previous30: WellnessRecord[];
  trends: MetricTrend[];
  insight: WellnessInsight | null;
  insightState: InsightState;
  recordCount: number;
  recentNotes: string[];
  hasData: boolean;
}
