/**
 * WellnessMonitor.tsx
 *
 * Premium AI Wellness Monitor for the Student Dashboard.
 *
 * Includes:
 * - Existing wellness/Supabase data
 * - Mood, Stress and Anxiety trend charts
 * - Recharts visualizations
 * - Smooth chart animations
 * - Interactive premium tooltips
 * - Metric averages
 * - Trend indicators
 * - AI/Groq wellness insight
 * - Local fallback insight
 * - Responsive layout
 * - Premium hover interactions
 *
 * No database changes required.
 * No additional API endpoint required.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Heart, Shield, Sparkles } from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { useAuth } from "../../auth/AuthProvider";

import { getWellnessRecords } from "../../services/wellnessService";

import {
  computeWellnessSnapshot,
  generateFallbackInsight,
} from "../../services/wellnessAnalytics";

import { getWellnessInsight } from "../../services/aiService";

import type {
  WellnessSnapshot,
  WellnessInsight,
  MetricTrend,
  WellnessRecord,
} from "../../types/wellness";

/* =========================================================
   TYPES
========================================================= */

type MetricKey = "mood" | "stress" | "anxiety";

type MetricConfig = {
  label: string;
  icon: ReactNode;
  color: string;
  softColor: string;
};

type ChartPoint = {
  day: string;
  fullDate: string;
  value: number;
};

/* =========================================================
   METRIC CONFIGURATION
========================================================= */

const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  mood: {
    label: "Mood",
    icon: <Heart size={15} />,
    color: "#4F9A72",
    softColor: "rgba(79, 154, 114, 0.12)",
  },

  stress: {
    label: "Stress",
    icon: <Brain size={15} />,
    color: "#C28A4A",
    softColor: "rgba(194, 138, 74, 0.12)",
  },

  anxiety: {
    label: "Anxiety",
    icon: <Shield size={15} />,
    color: "#7184B7",
    softColor: "rgba(113, 132, 183, 0.12)",
  },
};

/* =========================================================
   GET METRIC VALUE
========================================================= */

function getMetricValue(record: WellnessRecord, metric: MetricKey): number {
  if (metric === "mood") {
    return record.mood;
  }

  if (metric === "stress") {
    return record.stressLevel;
  }

  return record.anxietyLevel;
}

/* =========================================================
   GET AVERAGE
========================================================= */

function getMetricAverage(
  records: WellnessRecord[],
  metric: MetricKey,
): number | null {
  if (records.length === 0) {
    return null;
  }

  const total = records.reduce(
    (sum, record) => sum + getMetricValue(record, metric),
    0,
  );

  return Math.round((total / records.length) * 10) / 10;
}

/* =========================================================
   HUMAN READABLE SUMMARY
========================================================= */

function getMetricSummary(
  records: WellnessRecord[],
  metric: MetricKey,
): string {
  const average = getMetricAverage(records, metric);

  if (average === null) {
    return "No data";
  }

  if (metric === "mood") {
    if (average >= 4.2) {
      return "Very positive";
    }

    if (average >= 3.5) {
      return "Positive";
    }

    if (average >= 2.8) {
      return "Steady";
    }

    if (average >= 2) {
      return "Low";
    }

    return "Very low";
  }

  if (metric === "stress") {
    if (average <= 1.5) {
      return "Low";
    }

    if (average <= 2.5) {
      return "Mild";
    }

    if (average <= 3.5) {
      return "Moderate";
    }

    if (average <= 4.3) {
      return "High";
    }

    return "Very high";
  }

  if (average <= 1.5) {
    return "Lower";
  }

  if (average <= 2.5) {
    return "Mild";
  }

  if (average <= 3.5) {
    return "Moderate";
  }

  if (average <= 4.3) {
    return "Higher";
  }

  return "Very high";
}

/* =========================================================
   TREND ARROW
========================================================= */

function TrendArrow({ trend }: { trend: MetricTrend }) {
  if (trend.changePercent === null || trend.direction === "stable") {
    return (
      <span className="wm-trend-arrow wm-stable">
        <span aria-hidden="true">→</span>
        Stable
      </span>
    );
  }

  const isPositive =
    (trend.label === "Mood" && trend.direction === "improving") ||
    (trend.label !== "Mood" && trend.direction === "declining");

  return (
    <span className={`wm-trend-arrow ${isPositive ? "wm-up" : "wm-down"}`}>
      <span aria-hidden="true">
        {trend.direction === "improving" ? "↑" : "↓"}
      </span>
      {Math.abs(trend.changePercent)}%
    </span>
  );
}

/* =========================================================
   MINI TREND CHART
========================================================= */

function MiniTrend({
  recent7,
  metric,
}: {
  recent7: WellnessRecord[];
  metric: MetricKey;
}) {
  const config = METRIC_CONFIG[metric];

  const chartData = useMemo<ChartPoint[]>(() => {
    return [...recent7]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((record) => {
        const date = new Date(record.createdAt);

        return {
          day: date.toLocaleDateString(undefined, {
            weekday: "short",
          }),

          fullDate: date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          }),

          value: getMetricValue(record, metric),
        };
      });
  }, [recent7, metric]);

  if (chartData.length === 0) {
    return (
      <div className="wm-mini-chart wm-mini-chart-empty">No recent data</div>
    );
  }

  const gradientId = `wm-gradient-${metric}`;

  return (
    <div className={`wm-mini-chart wm-mini-chart-${metric}`}>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart
          data={chartData}
          margin={{
            top: 12,
            right: 5,
            left: 5,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity={0.25} />

              <stop
                offset="100%"
                stopColor={config.color}
                stopOpacity={0.015}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="rgba(65, 105, 87, 0.08)"
            strokeDasharray="3 5"
          />

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#94A39A",
              fontSize: 9,
              fontWeight: 600,
            }}
            dy={7}
          />

          <Tooltip
            cursor={{
              stroke: config.color,
              strokeOpacity: 0.18,
              strokeWidth: 1,
            }}
            labelFormatter={(_label, payload) => {
              const point = payload?.[0]?.payload as ChartPoint | undefined;

              return point?.fullDate ?? "";
            }}
            formatter={(value) => [`${value} / 5`, config.label]}
            contentStyle={{
              borderRadius: "14px",
              border: "1px solid rgba(55, 91, 73, 0.10)",
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 16px 40px rgba(30,67,52,0.14)",
              padding: "10px 12px",
            }}
            labelStyle={{
              color: "#819087",
              fontSize: "10px",
              fontWeight: 600,
              marginBottom: "4px",
            }}
            itemStyle={{
              color: config.color,
              fontSize: "12px",
              fontWeight: 700,
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{
              r: 3,
              fill: "#FFFFFF",
              stroke: config.color,
              strokeWidth: 1.5,
            }}
            activeDot={{
              r: 6,
              fill: config.color,
              stroke: "#FFFFFF",
              strokeWidth: 2.5,
            }}
            animationBegin={80}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  metric,
  recent7,
  trend,
}: {
  metric: MetricKey;
  recent7: WellnessRecord[];
  trend?: MetricTrend;
}) {
  const config = METRIC_CONFIG[metric];

  const average = getMetricAverage(recent7, metric);

  const summary = getMetricSummary(recent7, metric);

  return (
    <div className={`wm-metric-card wm-metric-${metric}`}>
      {/* Soft hover glow */}
      <span
        className="wm-metric-glow"
        style={{
          background: `radial-gradient(
            circle at 88% 8%,
            ${config.softColor},
            transparent 38%
          )`,
        }}
        aria-hidden="true"
      />

      <div className="wm-metric-header">
        <div className="wm-metric-title">
          <span
            className="wm-metric-icon"
            style={{
              color: config.color,
              background: config.softColor,
            }}
          >
            {config.icon}
          </span>

          <span>{config.label}</span>
        </div>

        {trend && <TrendArrow trend={trend} />}
      </div>

      <div className="wm-metric-value">{summary}</div>

      {average !== null && (
        <div className="wm-metric-average">
          <span>Average</span>

          <strong>{average.toFixed(1)}</strong>

          <span>/5</span>
        </div>
      )}

      <MiniTrend recent7={recent7} metric={metric} />
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function WellnessMonitor() {
  const { profile } = useAuth();

  const [snapshot, setSnapshot] = useState<WellnessSnapshot | null>(null);

  const [insight, setInsight] = useState<WellnessInsight | null>(null);

  const [loading, setLoading] = useState(true);

  /* =======================================================
     LOAD WELLNESS DATA
  ======================================================= */

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    const userId = profile.id;

    let active = true;

    async function load() {
      setLoading(true);

      try {
        const records = await getWellnessRecords(userId);

        if (!active) {
          return;
        }

        const snap = computeWellnessSnapshot(records);

        /*
         * Keep dashboard charts limited
         * to the latest 7 check-ins.
         */
        const latestSeven = [...snap.recent7]
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
          .slice(-7);

        const dashboardSnapshot = {
          ...snap,
          recent7: latestSeven,
        };

        setSnapshot(dashboardSnapshot);

        /*
         * Local fallback appears immediately.
         */
        const fallback = generateFallbackInsight(snap);

        setInsight({
          ...fallback,
          state: fallback.state,
        });

        /*
         * AI enhancement is non-blocking.
         */
        if (snap.insightState === "sufficient") {
          try {
            const aiText = await getWellnessInsight({
              checkInCount: snap.recordCount,

              daysCovered: snap.baseline?.daysCovered ?? 0,

              recentMood: snap.recent7.length
                ? Math.round(
                    (snap.recent7.reduce(
                      (sum, record) => sum + record.mood,
                      0,
                    ) /
                      snap.recent7.length) *
                      10,
                  ) / 10
                : null,

              recentStress: snap.recent7.length
                ? Math.round(
                    (snap.recent7.reduce(
                      (sum, record) => sum + record.stressLevel,
                      0,
                    ) /
                      snap.recent7.length) *
                      10,
                  ) / 10
                : null,

              recentAnxiety: snap.recent7.length
                ? Math.round(
                    (snap.recent7.reduce(
                      (sum, record) => sum + record.anxietyLevel,
                      0,
                    ) /
                      snap.recent7.length) *
                      10,
                  ) / 10
                : null,

              baselineMood: snap.baseline?.mood ?? null,

              baselineStress: snap.baseline?.stress ?? null,

              baselineAnxiety: snap.baseline?.anxiety ?? null,

              trends: snap.trends.map((trend) => ({
                label: trend.label,
                direction: trend.direction,
                strength: trend.strength,
              })),

              recentNotes: snap.recentNotes,
            });

            if (!active) {
              return;
            }

            setInsight({
              headline: "AI Insight",
              body: aiText,
              suggestion: "",
              state: "neutral",
            });
          } catch {
            /*
             * Groq failure should never
             * break the dashboard.
             */
          }
        }
      } catch {
        if (active) {
          setSnapshot(null);
          setInsight(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [profile]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <section className="surface wm-card wm-card-premium" aria-busy="true">
        <div className="wm-loading-header">
          <div>
            <p className="eyebrow">AI Wellness Monitor</p>

            <h2>Your wellbeing at a glance</h2>
          </div>

          <div className="wm-loading-orb" aria-hidden="true" />
        </div>

        <div className="wm-loading">
          <div className="wm-loading-bar" />
          <div className="wm-loading-bar wm-loading-bar-short" />
          <div className="wm-loading-bar" />
        </div>
      </section>
    );
  }

  /* =======================================================
     NO DATA
  ======================================================= */

  if (!snapshot || !snapshot.hasData) {
    return (
      <section className="surface wm-card wm-card-premium">
        <div className="wm-header">
          <div>
            <p className="eyebrow">AI Wellness Monitor</p>

            <h2>Your wellbeing at a glance</h2>
          </div>

          <div className="wm-symbol">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="wm-empty">
          <div className="wm-empty-orb">
            <Sparkles size={25} />
          </div>

          <p className="wm-empty-title">Your journey begins here</p>

          <p className="wm-empty-text">
            Complete a few check-ins to unlock your personal wellbeing patterns
            and gentle insights.
          </p>

          <Link className="btn btn-primary" to="/student/check-in">
            Start a check-in
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  /* =======================================================
     INSUFFICIENT DATA
  ======================================================= */

  if (snapshot.insightState === "insufficient") {
    return (
      <section className="surface wm-card wm-card-premium">
        <div className="wm-header">
          <div>
            <p className="eyebrow">AI Wellness Monitor</p>

            <h2>Your wellbeing at a glance</h2>
          </div>

          <div className="wm-symbol">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="wm-not-enough">
          <div className="wm-empty-orb">
            <Sparkles size={22} />
          </div>

          <p className="wm-not-enough-title">Still learning your pattern</p>

          <p className="wm-not-enough-text">
            We need a few more check-ins to build your personal baseline. Keep
            checking in and your trends will appear here.
          </p>

          <Link className="btn btn-primary" to="/student/check-in">
            Daily check-in
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  /* =======================================================
     FIND TRENDS
  ======================================================= */

  const moodTrend = snapshot.trends.find(
    (trend) => trend.label.toLowerCase() === "mood",
  );

  const stressTrend = snapshot.trends.find(
    (trend) => trend.label.toLowerCase() === "stress",
  );

  const anxietyTrend = snapshot.trends.find(
    (trend) => trend.label.toLowerCase() === "anxiety",
  );

  /* =======================================================
     STATUS
  ======================================================= */

  const statusClass =
    insight?.state === "positive"
      ? "wm-dot-good"
      : insight?.state === "supportive"
        ? "wm-dot-attention"
        : "wm-dot-neutral";

  const statusText =
    insight?.state === "positive"
      ? "Balanced"
      : insight?.state === "supportive"
        ? "Noticing a shift"
        : "Tracking";

  /* =======================================================
     FULL MONITOR
  ======================================================= */

  return (
    <section className="surface wm-card wm-card-premium">
      {/* Header */}
      <div className="wm-header">
        <div>
          <div className="wm-title-row">
            <span className="wm-sparkle">
              <Sparkles size={14} />
            </span>

            <p className="eyebrow">AI Wellness Monitor</p>
          </div>

          <h2>Your wellbeing at a glance</h2>
        </div>

        <Link className="wm-view-link" to="/student/wellness">
          View wellbeing
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Status */}
      <div className="wm-status wm-status-premium">
        <span className={`wm-dot ${statusClass}`} />

        <span className="wm-status-text">{statusText}</span>

        <span className="wm-status-caption">
          Based on your recent check-ins
        </span>
      </div>

      {/* Metric cards */}
      <div className="wm-metrics-grid">
        <MetricCard
          metric="mood"
          recent7={snapshot.recent7}
          trend={moodTrend}
        />

        <MetricCard
          metric="stress"
          recent7={snapshot.recent7}
          trend={stressTrend}
        />

        <MetricCard
          metric="anxiety"
          recent7={snapshot.recent7}
          trend={anxietyTrend}
        />
      </div>

      {/* Recent pattern */}
      <div className="wm-recent-pattern">
        <div className="wm-recent-pattern-header">
          <div>
            <h3>Your recent pattern</h3>

            <p>Last 7 check-ins</p>
          </div>

          <span className="wm-entry-count">
            {snapshot.recent7.length}{" "}
            {snapshot.recent7.length === 1 ? "entry" : "entries"}
          </span>
        </div>
      </div>

      {/* AI Insight */}
      {insight && (
        <div className={`wm-insight wm-insight-${insight.state}`}>
          <div className="wm-insight-header">
            <span className="wm-insight-icon">
              <Sparkles size={14} />
            </span>

            <span>{insight.headline}</span>
          </div>

          <p className="wm-insight-body">{insight.body}</p>

          {insight.suggestion && (
            <div className="wm-insight-suggestion">
              <span className="wm-suggestion-mark">✦</span>

              <span>
                <strong>Suggested next step</strong>

                <br />

                {insight.suggestion}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="wm-footer">
        <p className="wm-privacy-note">
          Based on {snapshot.recordCount} check-in
          {snapshot.recordCount === 1 ? "" : "s"}.{" "}
          <Link to="/student/wellness">Manage privacy</Link>
        </p>

        <Link className="wm-footer-link" to="/student/wellness">
          Explore patterns
          <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
