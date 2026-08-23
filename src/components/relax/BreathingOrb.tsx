/**
 * BreathingOrb — Premium luminous glass sphere.
 *
 * SVG sphere with multiple gradient layers, specular highlight,
 * rim light, atmospheric bloom. All driven by CSS custom properties
 * (--breath-scale, --breath-glow) — no SVG remounts.
 */

interface Props {
  scale: number;
  glow: number;
  reducedMotion: boolean;
}

export default function BreathingOrb({ scale, glow, reducedMotion }: Props) {
  return (
    <div
      className="breath-orb"
      style={{
        ["--breath-scale" as string]: scale,
        ["--breath-glow" as string]: glow,
        ["--breath-transition" as string]: reducedMotion
          ? "opacity 0.4s ease"
          : "transform 1.4s cubic-bezier(.25,.1,.25,1), filter 1.4s ease",
      }}
    >
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          {/* Bloom aura */}
          <radialGradient id="ob-bloom" cx="50%" cy="48%" r="50%">
            <stop offset="0%" stopColor="#7ecba1" stopOpacity={0.12 + glow * 0.22} />
            <stop offset="35%" stopColor="#4a9e6e" stopOpacity={0.06 + glow * 0.10} />
            <stop offset="100%" stopColor="#1a4a32" stopOpacity="0" />
          </radialGradient>

          {/* Main sphere body — dark edges to bright center */}
          <radialGradient id="ob-body" cx="38%" cy="32%" r="50%">
            <stop offset="0%" stopColor="#b8e4cc" stopOpacity="0.92" />
            <stop offset="12%" stopColor="#80cca8" stopOpacity="0.85" />
            <stop offset="28%" stopColor="#58b490" stopOpacity="0.70" />
            <stop offset="48%" stopColor="#3a9470" stopOpacity="0.55" />
            <stop offset="68%" stopColor="#247a58" stopOpacity="0.42" />
            <stop offset="85%" stopColor="#18604a" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#0e4436" stopOpacity="0.22" />
          </radialGradient>

          {/* Inner translucent glow */}
          <radialGradient id="ob-inner" cx="36%" cy="28%" r="32%">
            <stop offset="0%" stopColor="#f0fff5" stopOpacity={0.45 + glow * 0.30} />
            <stop offset="45%" stopColor="#c0ecd5" stopOpacity={0.12 + glow * 0.10} />
            <stop offset="100%" stopColor="#70b898" stopOpacity="0" />
          </radialGradient>

          {/* Specular highlight — bright white */}
          <radialGradient id="ob-spec" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.70" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Bottom rim light */}
          <linearGradient id="ob-rim" x1="25%" y1="85%" x2="75%" y2="100%">
            <stop offset="0%" stopColor="#a0d8bc" stopOpacity="0" />
            <stop offset="50%" stopColor="#b0e4cc" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#90d0b0" stopOpacity="0" />
          </linearGradient>

          {/* Subtle edge ring */}
          <radialGradient id="ob-ring" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="#90d0b4" stopOpacity="0" />
            <stop offset="95%" stopColor="#a0dcc0" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#b0e4cc" stopOpacity="0.04" />
          </radialGradient>

          <filter id="ob-soft">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* ── Bloom aura (large, soft, behind sphere) ── */}
        <circle cx="200" cy="200" r="198" fill="url(#ob-bloom)" />

        {/* ── Outer glow ring ─────────────────────────── */}
        <circle cx="200" cy="200" r="155" fill="none" stroke="#7ecba1" strokeWidth="1" strokeOpacity={0.04 + glow * 0.06} filter="url(#ob-soft)" />

        {/* ── Main sphere body ────────────────────────── */}
        <circle cx="200" cy="200" r="135" fill="url(#ob-body)" />

        {/* ── Edge ring — very subtle ─────────────────── */}
        <circle cx="200" cy="200" r="135" fill="url(#ob-ring)" />

        {/* ── Inner translucent glow ──────────────────── */}
        <circle cx="200" cy="200" r="95" fill="url(#ob-inner)" />

        {/* ── Bottom rim light ────────────────────────── */}
        <circle cx="200" cy="200" r="135" fill="url(#ob-rim)" />

        {/* ── Primary specular highlight ──────────────── */}
        <ellipse
          cx="168" cy="155"
          rx="42" ry="24"
          fill="url(#ob-spec)"
          transform="rotate(-12 168 155)"
        />

        {/* Bright core of highlight */}
        <ellipse
          cx="164" cy="150"
          rx="14" ry="8"
          fill="#ffffff"
          fillOpacity="0.38"
          transform="rotate(-12 164 150)"
        />

        {/* Tiny hot spot */}
        <circle cx="160" cy="146" r="3.5" fill="#ffffff" fillOpacity="0.50" />

        {/* ── Secondary reflection (lower-right) ──────── */}
        <ellipse
          cx="232" cy="240"
          rx="18" ry="10"
          fill="#d8f0e4"
          fillOpacity="0.08"
          transform="rotate(18 232 240)"
        />

        {/* ── Surface texture arcs ────────────────────── */}
        <path
          d="M 138 168 Q 158 200 148 245"
          stroke="#b0dcc4"
          strokeWidth="0.3"
          strokeOpacity="0.06"
          fill="none"
          filter="url(#ob-soft)"
        />
        <path
          d="M 235 178 Q 248 210 242 248"
          stroke="#a8d4bc"
          strokeWidth="0.25"
          strokeOpacity="0.05"
          fill="none"
          filter="url(#ob-soft)"
        />
      </svg>
    </div>
  );
}
