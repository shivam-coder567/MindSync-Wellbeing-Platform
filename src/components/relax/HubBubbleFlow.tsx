export default function HubBubbleFlow() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="hbf-bg" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#1e3e3a" />
          <stop offset="100%" stopColor="#0c1e1a" />
        </radialGradient>
        <radialGradient id="hbf-b1" cx="40%" cy="35%" r="50%">
          <stop offset="0%" stopColor="#e0f0ea" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#a8d8cc" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#6ec4b8" stopOpacity="0.04" />
        </radialGradient>
        <radialGradient id="hbf-b2" cx="38%" cy="32%" r="45%">
          <stop offset="0%" stopColor="#d0e8e0" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#90c8b8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#5aaa9a" stopOpacity="0.02" />
        </radialGradient>
        <radialGradient id="hbf-b3" cx="42%" cy="38%" r="48%">
          <stop offset="0%" stopColor="#c8e4dc" stopOpacity="0.18" />
          <stop offset="55%" stopColor="#88bca8" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#4a9a8a" stopOpacity="0.02" />
        </radialGradient>
      </defs>

      {/* Dark atmospheric background */}
      <rect width="320" height="200" fill="url(#hbf-bg)" />

      {/* Ambient glow zones */}
      <ellipse cx="120" cy="100" rx="80" ry="60" fill="#6ec4b8" fillOpacity="0.04" />
      <ellipse cx="240" cy="80" rx="60" ry="50" fill="#7ecba1" fillOpacity="0.03" />

      {/* Distant bubble silhouettes */}
      <circle cx="50" cy="40" r="12" stroke="#6ec4b8" strokeOpacity="0.06" strokeWidth="0.5" fill="none" />
      <circle cx="280" cy="170" r="8" stroke="#7ecba1" strokeOpacity="0.05" strokeWidth="0.4" fill="none" />
      <circle cx="30" cy="130" r="6" stroke="#6ec4b8" strokeOpacity="0.04" strokeWidth="0.3" fill="none" />

      {/* Main bubbles */}
      {/* Large bubble */}
      <circle cx="100" cy="110" r="32" fill="url(#hbf-b1)" stroke="#a8d8cc" strokeOpacity="0.12" strokeWidth="0.8" />
      <ellipse cx="92" cy="100" rx="12" ry="8" fill="#fff" fillOpacity="0.08" />
      <circle cx="88" cy="96" r="3" fill="#fff" fillOpacity="0.12" />

      {/* Medium bubble */}
      <circle cx="200" cy="80" r="22" fill="url(#hbf-b2)" stroke="#90c8b8" strokeOpacity="0.1" strokeWidth="0.6" />
      <ellipse cx="195" cy="74" rx="8" ry="5" fill="#fff" fillOpacity="0.07" />
      <circle cx="193" cy="72" r="2" fill="#fff" fillOpacity="0.1" />

      {/* Small bubble */}
      <circle cx="260" cy="130" r="16" fill="url(#hbf-b3)" stroke="#88bca8" strokeOpacity="0.08" strokeWidth="0.5" />
      <ellipse cx="256" cy="125" rx="6" ry="4" fill="#fff" fillOpacity="0.06" />

      {/* Tiny bubbles */}
      <circle cx="150" cy="50" r="8" fill="#6ec4b8" fillOpacity="0.06" stroke="#6ec4b8" strokeOpacity="0.06" strokeWidth="0.4" />
      <circle cx="70" cy="60" r="6" fill="#7ecba1" fillOpacity="0.05" stroke="#7ecba1" strokeOpacity="0.05" strokeWidth="0.3" />

      {/* Floating particles */}
      <circle cx="60" cy="90" r="1" fill="#6ec4b8" fillOpacity="0.35" />
      <circle cx="180" cy="150" r="0.8" fill="#7ecba1" fillOpacity="0.3" />
      <circle cx="240" cy="55" r="1.2" fill="#a8d8cc" fillOpacity="0.25" />
      <circle cx="130" cy="170" r="0.7" fill="#6ec4b8" fillOpacity="0.2" />
      <circle cx="290" cy="100" r="1" fill="#7ecba1" fillOpacity="0.25" />

      {/* Subtle wave lines */}
      <path d="M0 180 Q40 175 80 180 Q120 185 160 180 Q200 175 240 180 Q280 185 320 180" stroke="#6ec4b8" strokeOpacity="0.06" strokeWidth="0.5" fill="none" />
      <path d="M0 188 Q50 183 100 188 Q150 193 200 188 Q250 183 300 188 L320 188" stroke="#6ec4b8" strokeOpacity="0.04" strokeWidth="0.4" fill="none" />
    </svg>
  );
}
