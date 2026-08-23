/**
 * BubblePopEffect — Premium pop animation with rings and particles.
 *
 * Self-cleaning: removes itself from DOM after animation completes.
 * Duration: ~500ms.
 */

import { useEffect, useState } from "react";

interface Props {
  x: number;
  y: number;
  size: number;
  hue: number;
  onComplete: () => void;
}

/* Deterministic particle directions */
const PARTICLE_OFFSETS = [
  { dx: 0, dy: -22 },
  { dx: 18, dy: -12 },
  { dx: -16, dy: -14 },
  { dx: 8, dy: 18 },
  { dx: -12, dy: 14 },
  { dx: 20, dy: 4 },
  { dx: -18, dy: 6 },
  { dx: 4, dy: -8 },
];

export default function BubblePopEffect({ x, y, size, hue, onComplete }: Props) {
  const [phase, setPhase] = useState<"compress" | "expand" | "fade">("compress");

  useEffect(() => {
    /* Phase 1: compress (80ms) → Phase 2: expand (150ms) → Phase 3: fade (270ms) */
    const t1 = setTimeout(() => setPhase("expand"), 80);
    const t2 = setTimeout(() => setPhase("fade"), 230);
    const t3 = setTimeout(() => onComplete(), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const r = size / 2;
  const ringScale = phase === "compress" ? 0.6 : phase === "expand" ? 2.2 : 3.0;
  const ringOpacity = phase === "compress" ? 0.5 : phase === "expand" ? 0.3 : 0;
  const bubbleScale = phase === "compress" ? 0.7 : phase === "expand" ? 1.15 : 0.9;
  const bubbleOpacity = phase === "fade" ? 0 : 1;

  return (
    <div
      className="bubble-pop-effect"
      style={{ left: x, top: y, position: "fixed", pointerEvents: "none", zIndex: 100 }}
      aria-hidden="true"
    >
      {/* Pop ring */}
      <svg
        width={r * 6}
        height={r * 6}
        viewBox="0 0 120 120"
        fill="none"
        style={{
          position: "absolute",
          top: -r * 3,
          left: -r * 3,
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
          transition: "transform 0.3s cubic-bezier(.25,.1,.25,1), opacity 0.3s ease",
        }}
      >
        <circle cx="60" cy="60" r="20" stroke={`hsla(${hue}, 35%, 78%, 0.5)`} strokeWidth="1.5" fill="none" />
        <circle cx="60" cy="60" r="35" stroke={`hsla(${hue}, 30%, 72%, 0.3)`} strokeWidth="1" fill="none" />
        <circle cx="60" cy="60" r="50" stroke={`hsla(${hue}, 25%, 68%, 0.15)`} strokeWidth="0.6" fill="none" />
      </svg>

      {/* Tiny release particles */}
      {PARTICLE_OFFSETS.map((p, i) => (
        <div
          key={i}
          className={`bubble-pop-particle bubble-pop-p${i}`}
          style={{
            position: "absolute",
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: `hsla(${hue}, 35%, 82%, 0.55)`,
            top: 0,
            left: 0,
            "--px": `${p.dx}px`,
            "--py": `${p.dy}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
