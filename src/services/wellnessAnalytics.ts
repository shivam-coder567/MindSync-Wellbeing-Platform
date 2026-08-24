/**
 * wellnessAnalytics.ts
 *
 * Pure-function analytics engine.
 * Computes personal baselines, detects trends, and generates structured insights.
 * All calculations operate on the student's OWN data — never compared to others.
 */

import type {
  WellnessRecord,
  PersonalBaseline,
  MetricTrend,
  TrendDirection,
  TrendStrength,
  WellnessSnapshot,
} from "../types/wellness";

/* ── Helpers ────────────────────────────────────────────────── */

function daysBetween(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

function daysAgo(dateStr: string): number {
  return daysBetween(dateStr, new Date().toISOString());
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;

  return (
    Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100
  );
}

function pctChange(from: number, to: number): number | null {
  if (from === 0) return null;

  return Math.round(((to - from) / from) * 100);
}

/* ── Baseline computation ───────────────────────────────────── */

/**
 * Compute the student's historical baseline from check-ins older than
 * 14 days ago.
 *
 * Falls back to all records if fewer than 3 old records exist.
 */
export function computeBaseline(
  records: WellnessRecord[],
): PersonalBaseline | null {
  if (records.length < 3) return null;

  const sorted = [...records].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const olderRecords = sorted.filter((r) => new Date(r.createdAt) < cutoff);

  const source = olderRecords.length >= 3 ? olderRecords : sorted;

  return {
    mood: mean(source.map((r) => r.mood))!,
    stress: mean(source.map((r) => r.stressLevel))!,
    anxiety: mean(source.map((r) => r.anxietyLevel))!,
    count: source.length,
    daysCovered:
      source.length >= 2
        ? daysBetween(source[0].createdAt, source[source.length - 1].createdAt)
        : 0,
  };
}

/* ── Trend detection ────────────────────────────────────────── */

function classifyTrend(
  current: number,
  baseline: number,
  /**
   * Mood:
   *   higher = better
   *
   * Stress/anxiety:
   *   higher = worse
   */
  higherIsBetter: boolean,
): {
  direction: TrendDirection;
  strength: TrendStrength;
  changePercent: number;
} {
  const diff = current - baseline;

  const absDiff = Math.abs(diff);

  const absPct = Math.abs(pctChange(baseline, current) ?? 0);

  let direction: TrendDirection;

  if (absDiff < 0.15) {
    direction = "stable";
  } else if (diff > 0 === higherIsBetter) {
    direction = "improving";
  } else {
    direction = "declining";
  }

  let strength: TrendStrength;

  if (absDiff < 0.15) {
    strength = "minimal";
  } else if (absDiff < 0.45 || absPct < 8) {
    strength = "slight";
  } else if (absDiff < 0.85 || absPct < 20) {
    strength = "moderate";
  } else {
    strength = "noticeable";
  }

  return {
    direction,
    strength,
    changePercent: pctChange(baseline, current) ?? 0,
  };
}

function buildTrend(
  label: string,
  icon: string,
  current: number | null,
  baseline: number | null,
  higherIsBetter: boolean,
): MetricTrend {
  if (current === null || baseline === null) {
    return {
      current,
      baseline,
      direction: "stable",
      strength: "minimal",
      changePercent: null,
      label,
      icon,
    };
  }

  const { direction, strength, changePercent } = classifyTrend(
    current,
    baseline,
    higherIsBetter,
  );

  return {
    current,
    baseline,
    direction,
    strength,
    changePercent,
    label,
    icon,
  };
}

/* ── Snapshot ───────────────────────────────────────────────── */

export function computeWellnessSnapshot(
  allRecords: WellnessRecord[],
): WellnessSnapshot {
  if (allRecords.length === 0) {
    return {
      baseline: null,
      recent7: [],
      previous30: allRecords,
      trends: [],
      insight: null,
      insightState: "insufficient",
      recordCount: 0,
      recentNotes: [],
      hasData: false,
    };
  }

  /*
   * Newest first.
   */
  const sorted = [...allRecords].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  /*
   * Recent records.
   *
   * We intentionally use the student's real timestamps.
   * No synthetic/fabricated points are created.
   */
  const recent7 = sorted.filter((r) => daysAgo(r.createdAt) <= 10).slice(0, 7);
  const previous30 = sorted
    .filter((r) => daysAgo(r.createdAt) > 10)
    .slice(0, 30);

  const baseline = computeBaseline(sorted);

  const recentMood = mean(recent7.map((r) => r.mood));

  const recentStress = mean(recent7.map((r) => r.stressLevel));

  const recentAnxiety = mean(recent7.map((r) => r.anxietyLevel));

  const trends: MetricTrend[] = [
    buildTrend("Mood", "heart", recentMood, baseline?.mood ?? null, true),

    buildTrend(
      "Stress",
      "brain",
      recentStress,
      baseline?.stress ?? null,
      false,
    ),

    buildTrend(
      "Anxiety",
      "shield",
      recentAnxiety,
      baseline?.anxiety ?? null,
      false,
    ),
  ];

  const recentNotes = recent7
    .filter((r) => r.note && r.note.trim())
    .map((r) => r.note.trim())
    .slice(0, 5);

  const insightState: "sufficient" | "insufficient" =
    sorted.length >= 3 && baseline !== null ? "sufficient" : "insufficient";

  return {
    baseline,
    recent7,
    previous30,
    trends,
    insight: null,
    insightState,
    recordCount: allRecords.length,
    recentNotes,
    hasData: true,
  };
}

/* ── Fallback insight ───────────────────────────────────────── */

/**
 * Used when the AI service is unavailable.
 *
 * This keeps the dashboard functional even without an AI response.
 */
export function generateFallbackInsight(snapshot: WellnessSnapshot): {
  headline: string;
  body: string;
  suggestion: string;
  state: "positive" | "neutral" | "supportive";
} {
  const { trends, baseline, recordCount } = snapshot;

  if (!baseline || recordCount < 3) {
    return {
      headline: "Still getting to know you",
      body: "Keep checking in to build your personal wellbeing pattern. A few more entries will help us understand your rhythm.",
      suggestion: "Try a daily check-in this week.",
      state: "neutral",
    };
  }

  const moodTrend = trends.find((t) => t.label === "Mood");

  const stressTrend = trends.find((t) => t.label === "Stress");

  const anxietyTrend = trends.find((t) => t.label === "Anxiety");

  const decliningCount = [moodTrend, stressTrend, anxietyTrend].filter(
    (t) => t && t.direction === "declining",
  ).length;

  const improvingCount = [moodTrend, stressTrend, anxietyTrend].filter(
    (t) => t && t.direction === "improving",
  ).length;

  if (decliningCount >= 2) {
    return {
      headline: "Your wellbeing has shifted recently",

      body: "Your recent check-ins show some changes from your usual pattern. That is worth paying attention to.",

      suggestion:
        "Consider a short Relax & Reset session today, or reach out to a professional if things feel heavy.",

      state: "supportive",
    };
  }

  if (improvingCount >= 2) {
    return {
      headline: "You have been doing well",

      body: "Your recent check-ins show improvement from your usual baseline. Whatever you have been doing seems to be helping.",

      suggestion: "Notice what has been working and keep it up.",

      state: "positive",
    };
  }

  if (
    moodTrend &&
    stressTrend &&
    moodTrend.direction === "stable" &&
    stressTrend.direction === "stable"
  ) {
    return {
      headline: "Your pattern looks steady",

      body: "Your recent check-ins are close to your usual baseline. Maintaining awareness is a positive step.",

      suggestion: "Keep checking in regularly to notice any shifts early.",

      state: "neutral",
    };
  }

  return {
    headline: "A small shift is showing",

    body: "Your recent pattern has some small differences from your usual baseline. Small changes can be meaningful.",

    suggestion:
      "Reflect on what might be influencing your wellbeing this week.",

    state: "neutral",
  };
}

/* ── Chart data ──────────────────────────────────────────────── */

/**
 * Data used by WellnessTrendChart.
 *
 * IMPORTANT:
 * `date` contains the original database timestamp.
 * `label` is derived directly from that timestamp.
 *
 * We deliberately use "month + day" rather than weekday names.
 * This prevents confusing labels such as:
 *
 *     Sun  Sun  Sun  Mon  Mon
 *
 * when multiple check-ins happen on the same weekday.
 */
export interface ChartPoint {
  date: string;
  mood: number;
  stress: number;
  anxiety: number;
  label: string;
}

/**
 * Format an actual check-in timestamp for the chart.
 *
 * Example:
 *
 *     2026-08-24T18:30:00...
 *
 * becomes:
 *
 *     Aug 24
 */
function formatChartDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Build chart points from REAL wellness records.
 *
 * No points are fabricated.
 * No dates are generated.
 * The latest 14 actual check-ins are shown.
 */
export function buildChartData(records: WellnessRecord[]): ChartPoint[] {
  return [...records]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .slice(-14)
    .map((record) => ({
      date: record.createdAt,

      mood: record.mood,

      stress: record.stressLevel,

      anxiety: record.anxietyLevel,

      label: formatChartDate(record.createdAt),
    }));
}
