/**
 * Hub card illustration for Infinity Flow.
 * Abstract geometric network — lines connecting nodes.
 */
export default function HubInfinityFlow() {
  return (
    <svg
      viewBox="0 0 240 160"
      className="hub-illustration"
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <radialGradient id="hub-infinity-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(140, 200, 170, 0.2)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="hub-infinity-blur">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Background glow */}
      <ellipse cx="120" cy="80" rx="90" ry="60" fill="url(#hub-infinity-glow)" />

      {/* Grid lines — subtle */}
      {[40, 80, 120, 160, 200].map((x) => (
        <line key={`vl-${x}`} x1={x} y1="25" x2={x} y2="135" stroke="rgba(140,180,160,0.08)" strokeWidth="0.5" />
      ))}
      {[35, 65, 95, 125].map((y) => (
        <line key={`hl-${y}`} x1="25" y1={y} x2="215" y2={y} stroke="rgba(140,180,160,0.08)" strokeWidth="0.5" />
      ))}

      {/* Connected network paths — glow layer */}
      <g filter="url(#hub-infinity-blur)" opacity="0.4">
        <path d="M 60 35 L 100 35 L 100 65 L 140 65" stroke="#8cbfa5" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 100 65 L 100 95 L 140 95 L 180 95" stroke="#8cbfa5" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 140 65 L 140 95" stroke="#8cbfa5" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 60 95 L 100 95" stroke="#8cbfa5" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 140 95 L 140 125 L 180 125" stroke="#8cbfa5" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 180 65 L 180 95" stroke="#8cbfa5" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>

      {/* Connected network paths — main */}
      <g>
        <path d="M 60 35 L 100 35 L 100 65 L 140 65" stroke="#a8d4bc" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 100 65 L 100 95 L 140 95 L 180 95" stroke="#a8d4bc" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 140 65 L 140 95" stroke="#a8d4bc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 60 95 L 100 95" stroke="#a8d4bc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 140 95 L 140 125 L 180 125" stroke="#a8d4bc" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 180 65 L 180 95" stroke="#a8d4bc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Highlight */}
        <path d="M 60 35 L 100 35 L 100 65 L 140 65" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 100 65 L 100 95 L 140 95 L 180 95" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>

      {/* Nodes */}
      {[
        [60, 35], [100, 35], [100, 65], [140, 65],
        [60, 95], [100, 95], [140, 95], [180, 95],
        [140, 125], [180, 125], [180, 65],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={5} fill="#7eb39e" opacity={0.5} />
          <circle cx={cx} cy={cy} r={3} fill="#a8d4bc" />
          <circle cx={cx} cy={cy} r={1.5} fill="rgba(255,255,255,0.5)" />
        </g>
      ))}

      {/* Floating decorative particles */}
      {[
        { cx: 30, cy: 50, r: 1.5, o: 0.25 },
        { cx: 210, cy: 40, r: 1, o: 0.2 },
        { cx: 190, cy: 140, r: 1.2, o: 0.18 },
        { cx: 45, cy: 130, r: 1, o: 0.22 },
        { cx: 160, cy: 25, r: 0.8, o: 0.15 },
      ].map((p, i) => (
        <circle key={`p-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill="#b8d8c8" opacity={p.o} />
      ))}
    </svg>
  );
}
