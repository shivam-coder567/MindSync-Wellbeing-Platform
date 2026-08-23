import { ArrowLeft, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import HubBreathing from "../../components/relax/HubBreathing";
import HubGarden from "../../components/relax/HubGarden";
import HubBubbleFlow from "../../components/relax/HubBubbleFlow";
import HubInfinityFlow from "../../components/relax/HubInfinityFlow";

const activities = [
  {
    title: "Breathing",
    subtitle: "Luminous Breath",
    description: "A guided breathing rhythm with a living orb that expands and softens with your breath.",
    duration: "1 – 3 min",
    path: "/student/relax-reset/breathing",
    illustration: HubBreathing,
    accent: "#7ecba1",
    glow: "rgba(126, 203, 161, 0.15)",
  },
  {
    title: "Zen Garden",
    subtitle: "Quiet Garden",
    description: "Create a peaceful garden scene with stones, plants, and flowers at your own pace.",
    duration: "No limit",
    path: "/student/relax-reset/zen-garden",
    illustration: HubGarden,
    accent: "#c4a87a",
    glow: "rgba(196, 168, 122, 0.15)",
  },
  {
    title: "Bubble Flow",
    subtitle: "Gentle Drift",
    description: "Large translucent bubbles drift through a calm atmosphere. Tap to release them.",
    duration: "1 min",
    path: "/student/relax-reset/bubble-pop",
    illustration: HubBubbleFlow,
    accent: "#6ec4b8",
    glow: "rgba(110, 196, 184, 0.15)",
  },
  {
    title: "Infinity Flow",
    subtitle: "Quiet Geometry",
    description: "Rotate geometric tiles to connect all paths into one flowing network.",
    duration: "No limit",
    path: "/student/relax-reset/infinity-flow",
    illustration: HubInfinityFlow,
    accent: "#8cbfa5",
    glow: "rgba(140, 191, 165, 0.15)",
  },
];

export default function RelaxReset() {
  return (
    <main className="rr-hub">
      {/* Atmospheric background */}
      <div className="rr-hub-bg" aria-hidden="true">
        <div className="rr-hub-orb rr-hub-orb-1" />
        <div className="rr-hub-orb rr-hub-orb-2" />
        <div className="rr-hub-orb rr-hub-orb-3" />
      </div>

      <Link to="/student" className="rr-back">
        <ArrowLeft size={15} />
        Back to Overview
      </Link>

      {/* Hero */}
      <header className="rr-hub-hero">
        <p className="rr-eyebrow">Take a quiet moment</p>
        <h1 className="rr-hub-title">Relax &amp; Reset</h1>
        <p className="rr-hub-subtitle">
          A calm space to step away from everything.
          <br />
          Choose an experience — there is no rush.
        </p>
      </header>

      {/* Illustrated activity cards */}
      <section className="rr-hub-grid">
        {activities.map(({ title, subtitle, description, duration, path, illustration: Illustration, accent, glow }) => (
          <Link key={path} to={path} className="rr-hub-card" style={{ "--card-accent": accent, "--card-glow": glow } as React.CSSProperties}>
            {/* Illustrated scene */}
            <div className="rr-hub-card-scene">
              <div className="rr-hub-card-scene-glow" />
              <Illustration />
              <span className="rr-hub-card-duration" style={{ color: accent }}>{duration}</span>
            </div>

            {/* Content */}
            <div className="rr-hub-card-content">
              <p className="rr-hub-card-subtitle" style={{ color: accent }}>{subtitle}</p>
              <h2 className="rr-hub-card-title">{title}</h2>
              <p className="rr-hub-card-desc">{description}</p>
              <span className="rr-hub-card-action" style={{ color: accent }}>
                Enter
                <Waves size={14} style={{ transform: "rotate(-45deg)" }} />
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Safety footer */}
      <footer className="rr-hub-footer">
        <p>
          These experiences are for relaxation only and are not a substitute for
          professional care. If you need support, visit{" "}
          <Link to="/student/professionals">Professionals</Link> or{" "}
          <Link to="/student/sos">Get help now</Link>.
        </p>
      </footer>
    </main>
  );
}
