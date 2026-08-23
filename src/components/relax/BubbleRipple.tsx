import { useEffect, useState } from "react";

interface Props {
  x: number;
  y: number;
  hue: number;
  onComplete: () => void;
}

export default function BubbleRipple({ x, y, hue, onComplete }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="rr-ripple"
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ position: "absolute", top: -60, left: -60 }}>
        <circle cx="60" cy="60" r="20" stroke={`hsla(${hue}, 35%, 75%, 0.4)`} strokeWidth="1" fill="none" className="rr-ripple-ring rr-ripple-ring-1" />
        <circle cx="60" cy="60" r="35" stroke={`hsla(${hue}, 30%, 70%, 0.2)`} strokeWidth="0.6" fill="none" className="rr-ripple-ring rr-ripple-ring-2" />
        <circle cx="60" cy="60" r="50" stroke={`hsla(${hue}, 25%, 65%, 0.1)`} strokeWidth="0.4" fill="none" className="rr-ripple-ring rr-ripple-ring-3" />
        {/* Tiny release particles */}
        <circle cx="60" cy="40" r="1.5" fill={`hsla(${hue}, 40%, 85%, 0.5)`} className="rr-ripple-particle rr-ripple-p-p1" />
        <circle cx="75" cy="55" r="1" fill={`hsla(${hue}, 35%, 80%, 0.4)`} className="rr-ripple-particle rr-ripple-p-p2" />
        <circle cx="45" cy="50" r="1.2" fill={`hsla(${hue}, 38%, 82%, 0.45)`} className="rr-ripple-particle rr-ripple-p-p3" />
        <circle cx="55" cy="75" r="0.8" fill={`hsla(${hue}, 30%, 78%, 0.35)`} className="rr-ripple-particle rr-ripple-p-p4" />
        <circle cx="70" cy="70" r="1" fill={`hsla(${hue}, 32%, 80%, 0.3)`} className="rr-ripple-particle rr-ripple-p-p5" />
      </svg>
    </div>
  );
}
