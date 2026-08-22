import { ArrowRight, CalendarDays, HeartPulse, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { getStudentCheckIns, type CheckInRecord } from "../../services/checkInService";

const MOOD_LABELS = ["", "Very low", "Low", "Steady", "Good", "Very good"];

export default function Recovery() {
  const { profile } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    const studentId = profile.id;
    let active = true;
    async function loadCheckIns() {
      setLoading(true); setError("");
      try { const records = await getStudentCheckIns(studentId); if (active) setCheckIns(records); }
      catch { if (active) setError("We couldn't load your check-in history right now."); }
      finally { if (active) setLoading(false); }
    }
    void loadCheckIns();
    return () => { active = false; };
  }, [profile]);

  const timeline = useMemo(() => [...checkIns].reverse().slice(-14), [checkIns]);
  const latest = checkIns[0];
  const averageMood = average(checkIns.map((item) => item.mood));
  const averageStress = average(checkIns.map((item) => item.stressLevel));
  const averageAnxiety = average(checkIns.map((item) => item.anxietyLevel));

  return <main className="page">
    <div className="recovery-header">
      <div><p className="eyebrow">Recovery journey</p><h1>Your progress, at your pace.</h1><p className="lead">Your check-ins create a gentle picture of what has been feeling easier or heavier over time.</p></div>
      <span className="recovery-status"><HeartPulse size={16} /> Your private wellbeing view</span>
    </div>

    {!profile ? <section className="surface recovery-empty"><HeartPulse size={24} /><h2>Your student record is not linked yet</h2><p>Once your account is linked, your private check-in history will appear here.</p></section> : <>
      <section className="recovery-stat-grid" aria-label="Wellbeing summary">
        <article className="surface recovery-score"><div><p className="eyebrow">Latest mood</p><strong>{latest ? latest.mood : "—"}<span>/5</span></strong><p>{latest ? MOOD_LABELS[latest.mood] : "No check-ins yet"}</p></div><span className="recovery-score-icon"><HeartPulse size={23} /></span></article>
        <article className="surface recovery-stat"><p className="eyebrow">Check-ins recorded</p><strong>{checkIns.length}</strong><p>Every entry helps reveal your pattern.</p></article>
        <article className="surface recovery-stat"><p className="eyebrow">Average stress</p><strong>{averageStress ?? "—"}<span>{averageStress !== null ? "/5" : ""}</span></strong><p>Based on your saved check-ins.</p></article>
        <article className="surface recovery-stat"><p className="eyebrow">Average anxiety</p><strong>{averageAnxiety ?? "—"}<span>{averageAnxiety !== null ? "/5" : ""}</span></strong><p>Based on your saved check-ins.</p></article>
      </section>

      <section className="surface recovery-chart-card">
        <div className="recovery-chart-header"><div><p className="eyebrow">Wellbeing pattern</p><h2>Your check-in trend</h2><p>Use this to notice patterns, not to judge your progress.</p></div><div className="chart-key"><span><i className="mood" />Mood</span><span><i className="stress" />Stress</span><span><i className="anxiety" />Anxiety</span></div></div>
        {loading ? <div className="recovery-empty">Loading your private check-in history…</div> : error ? <div className="recovery-empty">{error}</div> : timeline.length === 0 ? <div className="recovery-empty"><CalendarDays size={24} /><h3>Your chart will grow with you</h3><p>Complete your first check-in to start building a private wellbeing trend.</p><Link className="btn btn-primary" to="/student/check-in">Start a check-in <ArrowRight size={16} /></Link></div> : <RecoveryChart data={timeline} />}
      </section>

      <section className="recovery-insight-grid">
        <article className="surface recovery-insight"><TrendingUp size={20} /><div><h3>Your recent average mood</h3><p>{averageMood ? `${averageMood}/5 across ${checkIns.length} check-in${checkIns.length === 1 ? "" : "s"}.` : "Add a check-in whenever you feel ready."}</p></div></article>
        <article className="surface recovery-insight"><Sparkles size={20} /><div><h3>A gentle reminder</h3><p>There is no “perfect” trend. Small changes can still be meaningful.</p></div></article>
      </section>

      <section className="recovery-next"><div><p className="eyebrow">Your next step</p><h2>Choose what feels helpful.</h2><p>You do not need to do everything at once.</p></div><div className="recovery-actions"><Link className="btn btn-primary" to="/student/check-in">Check in today <ArrowRight size={16} /></Link><Link className="btn btn-outline" to="/student/ai">Reflect with MindSync <Sparkles size={16} /></Link></div></section>
    </>}
  </main>;
}

function RecoveryChart({ data }: { data: CheckInRecord[] }) {
  const width = 760; const height = 280; const padding = { top: 24, right: 22, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right; const chartHeight = height - padding.top - padding.bottom;
  const xFor = (index: number) => padding.left + (data.length === 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
  const yFor = (value: number) => padding.top + ((5 - value) / 4) * chartHeight;
  const pathFor = (key: "mood" | "stressLevel" | "anxietyLevel") => data.map((item, index) => `${index === 0 ? "M" : "L"}${xFor(index)},${yFor(item[key])}`).join(" ");
  const labels = data.map((item, index) => ({ index, label: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(item.createdAt)) })).filter(({ index }) => index === 0 || index === data.length - 1 || (data.length > 4 && index === Math.floor((data.length - 1) / 2)));
  return <div className="recovery-chart-wrap"><svg className="recovery-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Mood, stress, and anxiety trend from recent check-ins"><title>Wellbeing check-in trend</title><desc>Each line uses your own saved check-ins on a one to five scale.</desc>{[1, 2, 3, 4, 5].map((value) => <g key={value}><line x1={padding.left} x2={width - padding.right} y1={yFor(value)} y2={yFor(value)} className="chart-grid-line" /><text x={padding.left - 10} y={yFor(value) + 4} textAnchor="end" className="chart-axis-label">{value}</text></g>)}<path d={pathFor("mood")} className="chart-line chart-line-mood" /><path d={pathFor("stressLevel")} className="chart-line chart-line-stress" /><path d={pathFor("anxietyLevel")} className="chart-line chart-line-anxiety" />{data.map((item, index) => <g key={item.id}><circle cx={xFor(index)} cy={yFor(item.mood)} r="4.5" className="chart-dot chart-dot-mood"><title>{`${labelsFor(item)}: Mood ${item.mood}/5`}</title></circle><circle cx={xFor(index)} cy={yFor(item.stressLevel)} r="3.4" className="chart-dot chart-dot-stress"><title>{`${labelsFor(item)}: Stress ${item.stressLevel}/5`}</title></circle><circle cx={xFor(index)} cy={yFor(item.anxietyLevel)} r="3.4" className="chart-dot chart-dot-anxiety"><title>{`${labelsFor(item)}: Anxiety ${item.anxietyLevel}/5`}</title></circle></g>)}{labels.map(({ index, label }) => <text key={index} x={xFor(index)} y={height - 13} textAnchor="middle" className="chart-axis-label">{label}</text>)}</svg><p className="chart-caption">Scale: 1 is lower and 5 is higher. Mood, stress, and anxiety are shown separately so you can see your own context.</p></div>;
}

function average(values: number[]) { if (!values.length) return null; return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10; }
function labelsFor(item: CheckInRecord) { return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(item.createdAt)); }
