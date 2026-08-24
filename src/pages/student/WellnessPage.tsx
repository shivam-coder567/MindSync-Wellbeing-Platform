/**
 * WellnessPage.tsx
 *
 * Dedicated /student/wellness page for the AI Wellness Monitor.
 * Shows personal trends, charts, AI insights, privacy controls,
 * and optional professional summary sharing.
 */

import { ArrowLeft, ArrowRight, Brain, CalendarDays, Heart, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { getWellnessRecords } from "../../services/wellnessService";
import {
  computeWellnessSnapshot,
  computeBaseline,
  buildChartData,
  generateFallbackInsight,
} from "../../services/wellnessAnalytics";
import { getWellnessInsight } from "../../services/aiService";
import type { WellnessSnapshot, WellnessInsight, MetricTrend } from "../../types/wellness";
import WellnessTrendChart from "../../components/wellness/WellnessTrendChart";

/* ── Helpers ────────────────────────────────────────────────── */

const TREND_ICONS: Record<string, React.ReactNode> = {
  heart: <Heart size={16} />,
  brain: <Brain size={16} />,
  shield: <Shield size={16} />,
};

function TrendCard({ trend }: { trend: MetricTrend }) {
  const isPositive =
    (trend.label === "Mood" && trend.direction === "improving") ||
    (trend.label !== "Mood" && trend.direction === "declining");

  return (
    <div className="surface wp-trend-card">
      <div className="wp-trend-top">
        <span className="wp-trend-icon">{TREND_ICONS[trend.icon]}</span>
        <span className="wp-trend-label">{trend.label}</span>
      </div>
      <div className="wp-trend-value">
        {trend.current !== null ? `${trend.current}/5` : "—"}
      </div>
      <div className="wp-trend-meta">
        {trend.changePercent !== null && trend.direction !== "stable" ? (
          <span className={`wp-trend-change ${isPositive ? "wp-positive" : "wp-negative"}`}>
            {trend.direction === "improving" ? "↑" : "↓"}{" "}
            {Math.abs(trend.changePercent)}% vs your baseline
          </span>
        ) : (
          <span className="wp-trend-change wp-stable">→ Close to your baseline</span>
        )}
      </div>
      {trend.baseline !== null && (
        <div className="wp-trend-baseline">
          Your baseline: {trend.baseline}/5
        </div>
      )}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */

export default function WellnessPage() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<Awaited<ReturnType<typeof getWellnessRecords>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [insight, setInsight] = useState<WellnessInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);

  // Privacy consent
  const [consentEnabled, setConsentEnabled] = useState(() => {
    try {
      return sessionStorage.getItem("mindsync-wellness-consent") !== "false";
    } catch {
      return true;
    }
  });

  // Professional sharing
  const [shareEnabled, setShareEnabled] = useState(false);
  const [sharePreview, setSharePreview] = useState(false);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getWellnessRecords(profile!.id);
        if (active) setRecords(data);
      } catch {
        if (active) setError("We could not load your check-in history right now.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [profile]);

  // Compute snapshot
  const snapshot: WellnessSnapshot = useMemo(
    () => computeWellnessSnapshot(records),
    [records],
  );

  const chartData = useMemo(() => buildChartData(records), [records]);

  const baseline = snapshot.baseline;

  // Generate AI insight
  useEffect(() => {
    if (snapshot.insightState !== "sufficient" || !consentEnabled) {
      setInsight(generateFallbackInsight(snapshot));
      return;
    }

    let active = true;

    async function generate() {
      setInsightLoading(true);
      setInsightError(false);
      try {
        const recentMood = snapshot.recent7.length
          ? Math.round((snapshot.recent7.reduce((s, r) => s + r.mood, 0) / snapshot.recent7.length) * 10) / 10
          : null;
        const recentStress = snapshot.recent7.length
          ? Math.round((snapshot.recent7.reduce((s, r) => s + r.stressLevel, 0) / snapshot.recent7.length) * 10) / 10
          : null;
        const recentAnxiety = snapshot.recent7.length
          ? Math.round((snapshot.recent7.reduce((s, r) => s + r.anxietyLevel, 0) / snapshot.recent7.length) * 10) / 10
          : null;

        const aiText = await getWellnessInsight({
          checkInCount: snapshot.recordCount,
          daysCovered: baseline?.daysCovered ?? 0,
          recentMood,
          recentStress,
          recentAnxiety,
          baselineMood: baseline?.mood ?? null,
          baselineStress: baseline?.stress ?? null,
          baselineAnxiety: baseline?.anxiety ?? null,
          trends: snapshot.trends.map((t) => ({
            label: t.label,
            direction: t.direction,
            strength: t.strength,
          })),
          recentNotes: snapshot.recentNotes,
        });

        if (active) {
          setInsight({
            headline: "AI Insight",
            body: aiText,
            suggestion: "",
            state: "neutral",
          });
        }
      } catch {
        if (active) {
          setInsightError(true);
          setInsight(generateFallbackInsight(snapshot));
        }
      } finally {
        if (active) setInsightLoading(false);
      }
    }

    void generate();
    return () => { active = false; };
  }, [snapshot.insightState, consentEnabled, snapshot, baseline]);

  // Consent toggle
  function toggleConsent() {
    const next = !consentEnabled;
    setConsentEnabled(next);
    try {
      sessionStorage.setItem("mindsync-wellness-consent", String(next));
    } catch { /* */ }
  }

  // Professional summary text
  const summaryText = useMemo(() => {
    if (!snapshot.hasData || !baseline) return "";
    const parts: string[] = [];
    parts.push("WELLBEING SUMMARY");
    parts.push(`Based on ${snapshot.recordCount} check-ins.`);
    parts.push("");

    snapshot.trends.forEach((t) => {
      if (t.direction === "stable") {
        parts.push(`• ${t.label}: Stable (close to your personal baseline of ${t.baseline}/5).`);
      } else {
        const dir = t.direction === "improving" ? "improved" : "declined";
        parts.push(`• ${t.label}: Has ${dir} compared to your baseline (${t.baseline}/5 → ${t.current}/5).`);
      }
    });

    if (snapshot.recentNotes.length > 0) {
      parts.push("");
      parts.push("Recent notes from your check-ins:");
      snapshot.recentNotes.forEach((note, i) => {
        parts.push(`  ${i + 1}. "${note}"`);
      });
    }

    parts.push("");
    parts.push("This is an AI-generated summary of your personal patterns.");
    parts.push("It is not a diagnosis. A professional should review your full context.");

    return parts.join("\n");
  }, [snapshot, baseline]);

  // ── Loading ──
  if (loading) {
    return (
      <main className="page">
        <Link to="/student" className="rr-back"><ArrowLeft size={15} /> Back to Overview</Link>
        <p className="eyebrow">AI Wellness Monitor</p>
        <h1>Loading your wellbeing patterns…</h1>
        <div className="wp-loading-grid">
          <div className="surface wp-loading-card"><div className="wm-loading-bar" /><div className="wm-loading-bar wm-loading-bar-short" /></div>
          <div className="surface wp-loading-card"><div className="wm-loading-bar" /><div className="wm-loading-bar wm-loading-bar-short" /></div>
          <div className="surface wp-loading-card"><div className="wm-loading-bar" /><div className="wm-loading-bar wm-loading-bar-short" /></div>
        </div>
      </main>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <main className="page">
        <Link to="/student" className="rr-back"><ArrowLeft size={15} /> Back to Overview</Link>
        <p className="eyebrow">AI Wellness Monitor</p>
        <h1>Something went wrong</h1>
        <p className="lead">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
      </main>
    );
  }

  // ── No data ──
  if (!snapshot.hasData) {
    return (
      <main className="page">
        <Link to="/student" className="rr-back"><ArrowLeft size={15} /> Back to Overview</Link>
        <p className="eyebrow">AI Wellness Monitor</p>
        <h1>Your wellbeing journey</h1>
        <p className="lead">We are still learning your personal pattern.</p>
        <div className="surface wp-empty-state">
          <CalendarDays size={32} style={{ opacity: 0.5 }} />
          <h2>Not enough data yet</h2>
          <p>Complete a few more check-ins to unlock your wellbeing trends. Each check-in helps us understand your personal rhythm.</p>
          <Link className="btn btn-primary" to="/student/check-in">
            Start a check-in <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  // ── Full page ──
  return (
    <main className="page">
      <Link to="/student" className="rr-back"><ArrowLeft size={15} /> Back to Overview</Link>

      <p className="eyebrow">AI Wellness Monitor</p>
      <h1>Your personal wellbeing patterns</h1>
      <p className="lead">
        Your check-ins reveal gentle trends in how you have been feeling.
        This is about your own pattern — not comparison to anyone else.
      </p>

      {/* ── Trend cards ── */}
      <section className="wp-trend-grid" aria-label="Wellbeing trends">
        {snapshot.trends.map((t) => (
          <TrendCard key={t.label} trend={t} />
        ))}
      </section>

      {/* ── Chart ── */}
      {chartData.length > 0 && (
        <section className="surface wp-chart-card" aria-label="Wellbeing trend chart">
          <div className="wp-chart-header">
            <div>
              <p className="eyebrow">Trend visualization</p>
              <h2>Your check-in pattern</h2>
              <p style={{ marginTop: 4, fontSize: 14, color: "#71817a" }}>
                Scale: 1 (lower) to 5 (higher). Lines show your own personal history.
              </p>
            </div>
          </div>
          <WellnessTrendChart data={chartData} />
        </section>
      )}

      {chartData.length === 0 && (
        <section className="surface wp-chart-card" aria-label="No chart data">
          <p className="eyebrow">Trend visualization</p>
          <h2>Your chart will grow with you</h2>
          <div className="wp-empty-chart">
            <CalendarDays size={28} style={{ opacity: 0.4 }} />
            <p>Complete more check-ins to see your personal trend chart.</p>
          </div>
        </section>
      )}

      {/* ── AI Insight ── */}
      <section className="surface wp-insight-card" aria-label="AI Insight">
        <div className="wp-insight-header">
          <Sparkles size={18} />
          <p className="eyebrow" style={{ marginBottom: 0 }}>AI Insight</p>
        </div>

        {insightLoading ? (
          <div className="wp-insight-loading">
            <div className="wm-loading-bar" />
            <div className="wm-loading-bar wm-loading-bar-short" />
          </div>
        ) : insight ? (
          <div className="wp-insight-content">
            {insight.headline && <h3 className="wp-insight-headline">{insight.headline}</h3>}
            <p className="wp-insight-body">{insight.body}</p>
            {insight.suggestion && (
              <div className="wp-insight-suggestion">
                <strong>What may help:</strong> {insight.suggestion}
              </div>
            )}
            {insightError && (
              <p className="wp-insight-fallback-note">
                Showing a calculated insight. The AI service was not available.
              </p>
            )}
          </div>
        ) : null}

        <div className="wp-insight-support">
          <p>
            It sounds like things may be feeling difficult right now. You do not
            have to handle this alone.
          </p>
          <div className="wp-insight-support-links">
            <Link className="btn btn-outline" to="/student/professionals">
              Find a professional <ArrowRight size={14} />
            </Link>
            <Link className="btn btn-outline" to="/student/sos">
              Get help now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Privacy & consent ── */}
      <section className="surface wp-privacy-card" aria-label="Privacy controls">
        <h2>AI Wellness Insights</h2>
        <p className="wp-privacy-desc">
          MindSync can analyze your wellbeing information to identify personal
          patterns and provide supportive suggestions.
        </p>

        <div className="wp-privacy-toggle-row">
          <div>
            <strong>Enable AI insights</strong>
            <p className="wp-privacy-sub">
              When enabled, your check-in data is analyzed to generate supportive
              wellbeing insights.
            </p>
          </div>
          <button
            className={`wp-toggle ${consentEnabled ? "wp-toggle-on" : ""}`}
            onClick={toggleConsent}
            role="switch"
            aria-checked={consentEnabled}
            aria-label="Toggle AI wellness insights"
          >
            <span className="wp-toggle-thumb" />
          </button>
        </div>

        <div className="wp-privacy-list">
          <p>What is analyzed:</p>
          <ul>
            <li><Heart size={13} /> Daily check-ins (mood, stress, anxiety)</li>
            <li><Brain size={13} /> Personal wellbeing trends</li>
            <li><Sparkles size={13} /> Check-in notes (if provided)</li>
          </ul>
        </div>

        <p className="wp-privacy-note">
          Your data is private. It is used only to generate your personal insights
          and is never compared to other students. You can disable this at any time.
        </p>
      </section>

      {/* ── Professional sharing ── */}
      <section className="surface wp-share-card" aria-label="Professional sharing">
        <h2>Share with your professional</h2>
        <p className="wp-privacy-desc">
          Your AI-generated summary contains patterns from your recent MindSync
          activity. You control when and if this is shared.
        </p>

        <div className="wp-privacy-toggle-row">
          <div>
            <strong>Allow sharing</strong>
            <p className="wp-privacy-sub">
              When enabled, you can generate and share a summary with your
              assigned professional.
            </p>
          </div>
          <button
            className={`wp-toggle ${shareEnabled ? "wp-toggle-on" : ""}`}
            onClick={() => setShareEnabled((v) => !v)}
            role="switch"
            aria-checked={shareEnabled}
            aria-label="Toggle professional sharing"
          >
            <span className="wp-toggle-thumb" />
          </button>
        </div>

        {shareEnabled && (
          <div className="wp-share-content">
            <button
              className="btn btn-outline"
              onClick={() => setSharePreview((v) => !v)}
            >
              {sharePreview ? "Hide preview" : "Preview summary"}
            </button>

            {sharePreview && summaryText && (
              <pre className="wp-share-preview">{summaryText}</pre>
            )}

            <button className="btn btn-primary" style={{ marginTop: 12 }}>
              Share with professional <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>

      {/* ── Safety ── */}
      <section className="info-box" style={{ marginTop: 20 }}>
        <Shield size={16} style={{ verticalAlign: "middle", marginRight: 8, color: "#4d8f64" }} />
        The AI Wellness Monitor is not a diagnostic tool. It identifies personal
        patterns and provides supportive suggestions only. If you need immediate
        support, visit{" "}
        <Link to="/student/professionals">Professionals</Link> or{" "}
        <Link to="/student/sos">Get help now</Link>.
      </section>
    </main>
  );
}
