import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  HeartPulse,
  Leaf,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { supabase } from "../../supabaseClient";
import { getStudentCheckIns, type CheckInRecord } from "../../services/checkInService";
import WellnessMonitor from "../../components/wellness/WellnessMonitor";

import avatar1 from "../../assets/avatars/avatar-1.svg";
import avatar2 from "../../assets/avatars/avatar-2.svg";
import avatar3 from "../../assets/avatars/avatar-3.svg";
import avatar4 from "../../assets/avatars/avatar-4.svg";
import avatar5 from "../../assets/avatars/avatar-5.svg";
import avatar6 from "../../assets/avatars/avatar-6.svg";

const BUILT_IN_AVATARS = [
  { id: "avatar-1", src: avatar1 },
  { id: "avatar-2", src: avatar2 },
  { id: "avatar-3", src: avatar3 },
  { id: "avatar-4", src: avatar4 },
  { id: "avatar-5", src: avatar5 },
  { id: "avatar-6", src: avatar6 },
];

const features = [
  {
    title: "AI Companion",
    description: "A calm place to put your thoughts into words.",
    path: "/student/ai",
    icon: Sparkles,
  },
  {
    title: "Daily check-in",
    description: "Notice your mood, stress, and anxiety today.",
    path: "/student/check-in",
    icon: ClipboardCheck,
  },
  {
    title: "Find a professional",
    description: "Explore caring support when you are ready.",
    path: "/student/professionals",
    icon: Stethoscope,
  },
  {
    title: "Your messages",
    description: "Continue conversations with your support team.",
    path: "/student/chat",
    icon: MessageCircle,
  },
  {
    title: "Recovery journey",
    description: "See the small steps that are adding up.",
    path: "/student/recovery",
    icon: TrendingUp,
  },
  {
    title: "My profile",
    description: "Keep your preferences and contacts up to date.",
    path: "/student/profile",
    icon: UserRound,
  },
];

const MOOD_LABELS = ["", "Very low", "Low", "Steady", "Good", "Very good"];

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);

  const name =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there";

  const firstName = name.split(" ")[0];

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarType = profile?.avatarType || "initials";
  const avatarValue = profile?.avatarValue || "";

  const photoUrl =
    avatarType === "photo" && avatarValue
      ? supabase.storage.from("profile-photos").getPublicUrl(avatarValue).data
          .publicUrl
      : null;

  const avatarUrl =
    avatarType === "avatar"
      ? BUILT_IN_AVATARS.find((avatar) => avatar.id === avatarValue)?.src ||
        null
      : null;

  const profileImage = photoUrl || avatarUrl;

  useEffect(() => {
    if (!profile) { setCheckIns([]); setHistoryLoading(false); return; }
    const studentId = profile.id;
    let active = true;
    async function loadDashboardHistory() {
      setHistoryLoading(true); setHistoryError(false);
      try { const records = await getStudentCheckIns(studentId); if (active) setCheckIns(records); }
      catch { if (active) setHistoryError(true); }
      finally { if (active) setHistoryLoading(false); }
    }
    void loadDashboardHistory();
    return () => { active = false; };
  }, [profile]);

  const latestCheckIn = checkIns[0];
  const currentStreak = useMemo(() => calculateStreak(checkIns), [checkIns]);
  const monthCheckIns = useMemo(() => checkIns.filter((entry) => new Date(entry.createdAt).getMonth() === new Date().getMonth() && new Date(entry.createdAt).getFullYear() === new Date().getFullYear()).length, [checkIns]);
  const recentActivity = checkIns.slice(0, 3).map((entry) => ({ id: entry.id, day: formatRelativeDay(entry.createdAt), title: "Daily check-in", detail: `Mood recorded as ${MOOD_LABELS[entry.mood]}`, icon: HeartPulse }));

  return (
    <main className="page">
      {/* Welcome */}
      <section className="hero-grid">
        <div className="welcome-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
            }}
          >
            <div>
              <p className="eyebrow">A moment for you</p>

              <h1>Good to see you, {firstName}.</h1>

              <p className="lead">
                There is no right way to feel today. Start with the space that
                feels most helpful.
              </p>
            </div>

            {/* Profile image */}
            <Link
              to="/student/profile"
              aria-label="Open my profile"
              style={{
                flexShrink: 0,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #dcefe4, #bcdcc9)",
                  color: "#286557",
                  fontSize: 22,
                  fontWeight: 700,
                  border: "3px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 8px 24px rgba(40,101,87,0.14)",
                }}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${name}'s profile`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  initials
                )}
              </div>
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            <Link className="btn btn-primary" to="/student/check-in">
              Start today&apos;s check-in
              <ArrowRight size={16} />
            </Link>

            <Link
              className="btn"
              to="/student/ai"
              style={{
                background: "rgba(255,255,255,0.72)",
              }}
            >
              Talk to AI Companion
              <Sparkles size={16} />
            </Link>
          </div>
        </div>

        <aside className="focus-card">
          <div>
            <p className="eyebrow">Your gentle focus</p>

            <h2>One small check-in can make your day feel clearer.</h2>
          </div>

          <div>
            <span className="focus-pill">
              <HeartPulse size={14} />
              Your wellbeing matters
            </span>

            <p
              style={{
                marginTop: 16,
                marginBottom: 0,
                fontSize: 13,
              }}
            >
              You&apos;re building awareness, one day at a time.
            </p>
          </div>
        </aside>
      </section>

      {/* Snapshot */}
      <section className="stats-grid" aria-label="Wellbeing snapshot">
        <div className="stat-card">
          <div className="stat-top">
            <span>Current streak</span>

            <span className="stat-icon">
              <CalendarCheck size={17} />
            </span>
          </div>

          <div className="stat-value">{historyLoading ? "—" : `${currentStreak} day${currentStreak === 1 ? "" : "s"}`}</div>

          <p className="stat-note">{historyError ? "History unavailable right now" : currentStreak ? "A thoughtful habit in progress" : "Start with a check-in today"}</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Recent mood</span>

            <span className="stat-icon">
              <HeartPulse size={17} />
            </span>
          </div>

          <div className="stat-value">{historyLoading ? "—" : latestCheckIn ? MOOD_LABELS[latestCheckIn.mood] : "No entry"}</div>

          <p className="stat-note">{latestCheckIn ? "From your latest check-in" : "Your next check-in starts here"}</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>This month</span>

            <span className="stat-icon">
              <TrendingUp size={17} />
            </span>
          </div>

          <div className="stat-value">{historyLoading ? "—" : monthCheckIns}</div>

          <p className="stat-note">{monthCheckIns === 1 ? "Check-in recorded this month" : "Check-ins recorded this month"}</p>
        </div>
      </section>

      {/* AI Wellness Monitor */}
      <WellnessMonitor />

      {/* Today's plan */}
      <section style={{ marginTop: 34 }}>
        <div className="section-head">
          <div>
            <h2>Today&apos;s gentle plan</h2>

            <p>A few small options for taking care of yourself today.</p>
          </div>
        </div>

        <div className="feature-grid">
          <Link className="feature-card" to="/student/check-in">
            <span className="feature-icon">
              <ClipboardCheck size={20} />
            </span>

            <h3>Check in with yourself</h3>

            <p>Take a moment to notice your mood, stress, and anxiety.</p>

            <ArrowRight className="arrow" size={18} />
          </Link>

          <Link className="feature-card" to="/student/recovery">
            <span className="feature-icon">
              <TrendingUp size={20} />
            </span>

            <h3>Take one small step</h3>

            <p>Continue a recovery goal at a pace that feels manageable.</p>

            <ArrowRight className="arrow" size={18} />
          </Link>

          <Link className="feature-card" to="/student/ai">
            <span className="feature-icon">
              <Sparkles size={20} />
            </span>

            <h3>Clear your mind</h3>

            <p>Put a thought into words and give yourself some space.</p>

            <ArrowRight className="arrow" size={18} />
          </Link>

          <Link className="feature-card" to="/student/relax-reset">
            <span className="feature-icon">
              <Leaf size={20} />
            </span>

            <h3>Need a little reset? 🌿</h3>

            <p>Take a short break with a calming activity.</p>

            <ArrowRight className="arrow" size={18} />
          </Link>
        </div>
      </section>

      {/* Recent activity */}
      <section style={{ marginTop: 34 }}>
        <div className="section-head">
          <div>
            <h2>Recent activity</h2>

            <p>A simple look at the moments you&apos;ve recorded.</p>
          </div>

          <Link className="text-link" to="/student/check-in">
            View check-ins
          </Link>
        </div>

        <div className="surface">
          {historyLoading ? <div className="empty-state">Loading your recent check-ins…</div> : historyError ? <div className="empty-state">Your recent check-ins could not be loaded right now.</div> : recentActivity.length === 0 ? <div className="empty-state">Your recent check-ins will appear here after you save your first one.</div> : recentActivity.map(({ id, day, title, detail, icon: Icon }, index) => (
            <div
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "17px 20px",
                borderBottom:
                  index !== recentActivity.length - 1
                    ? "1px solid rgba(75, 142, 102, 0.10)"
                    : "none",
              }}
            >
              <span className="feature-icon">
                <Icon size={18} />
              </span>

              <div style={{ flex: 1 }}>
                <strong
                  style={{
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  {title}
                </strong>

                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    fontSize: 13,
                    color: "#71817a",
                  }}
                >
                  {detail}
                </span>
              </div>

              <span
                style={{
                  fontSize: 12,
                  color: "#8c9a94",
                }}
              >
                {day}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Main feature space */}
      <section style={{ marginTop: 34 }}>
        <div className="section-head">
          <div>
            <h2>Your wellbeing space</h2>

            <p>Choose what would feel most supportive right now.</p>
          </div>

          <Link className="text-link" to="/student/profile">
            My profile
          </Link>
        </div>

        <div className="feature-grid">
          {features.map(({ title, description, path, icon: Icon }) => (
            <Link className="feature-card" key={path} to={path}>
              <span className="feature-icon">
                <Icon size={20} />
              </span>

              <h3>{title}</h3>

              <p>{description}</p>

              <ArrowRight className="arrow" size={18} />
            </Link>
          ))}
        </div>
      </section>

      {/* Safety note */}
      <section className="info-box" style={{ marginTop: 26 }}>
        <ShieldAlert
          size={16}
          style={{
            verticalAlign: "middle",
            marginRight: 8,
            color: "#4d8f64",
          }}
        />
        MindSync supports wellbeing but does not replace professional care. If
        you are in immediate danger, use{" "}
        <Link to="/student/sos">Get help now</Link>.
      </section>
    </main>
  );
}

function calculateStreak(checkIns: CheckInRecord[]) {
  const days = new Set(checkIns.map((entry) => toDayKey(entry.createdAt)));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(toDayKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(toDayKey(cursor.toISOString()))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function toDayKey(value: string) { const date = new Date(value); return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }

function formatRelativeDay(value: string) {
  const today = toDayKey(new Date().toISOString());
  const date = new Date(value);
  const day = toDayKey(value);
  if (day === today) return "Today";
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (day === toDayKey(yesterday.toISOString())) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
