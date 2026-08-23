export default function HubBreathing() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* Atmospheric glow */}
      <defs>
        <radialGradient id="hb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7ecba1" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#4a9e6e" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1a3a2e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hb-orb" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#c8eed8" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#7ecba1" stopOpacity="0.8" />
          <stop offset="75%" stopColor="#4a9e6e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2d6b52" stopOpacity="0.4" />
        </radialGradient>
        <radialGradient id="hb-highlight" cx="40%" cy="35%" r="35%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background atmosphere */}
      <rect width="320" height="200" fill="url(#hb-glow)" />

      {/* Outer rings */}
      <circle cx="160" cy="100" r="70" stroke="#7ecba1" strokeOpacity="0.08" strokeWidth="0.8" />
      <circle cx="160" cy="100" r="85" stroke="#7ecba1" strokeOpacity="0.05" strokeWidth="0.6" />
      <circle cx="160" cy="100" r="100" stroke="#7ecba1" strokeOpacity="0.03" strokeWidth="0.5" />

      {/* Soft botanical accents */}
      <path d="M60 170 Q70 140 85 155 Q75 165 60 170Z" fill="#4a7a4e" fillOpacity="0.15" />
      <path d="M250 165 Q260 135 275 150 Q265 160 250 165Z" fill="#5a8a5e" fillOpacity="0.12" />
      <path d="M45 155 Q55 130 65 145 Q55 152 45 155Z" fill="#3a6a3e" fillOpacity="0.1" />
      <path d="M265 150 Q275 125 285 140 Q275 148 265 150Z" fill="#4a7a4e" fillOpacity="0.1" />

      {/* Main orb */}
      <circle cx="160" cy="100" r="38" fill="url(#hb-orb)" />
      <circle cx="160" cy="100" r="38" fill="url(#hb-highlight)" />

      {/* Orb edge irregularity */}
      <ellipse cx="155" cy="95" rx="36" ry="37" fill="none" stroke="#a8d8b8" strokeOpacity="0.15" strokeWidth="0.5" />

      {/* Particles */}
      <circle cx="90" cy="60" r="1.5" fill="#7ecba1" fillOpacity="0.4" />
      <circle cx="230" cy="45" r="1" fill="#a8d8b8" fillOpacity="0.35" />
      <circle cx="120" cy="150" r="1.2" fill="#7ecba1" fillOpacity="0.3" />
      <circle cx="210" cy="140" r="0.8" fill="#c8eed8" fillOpacity="0.3" />
      <circle cx="70" cy="110" r="1" fill="#5a9a6e" fillOpacity="0.25" />
      <circle cx="255" cy="90" r="1.3" fill="#7ecba1" fillOpacity="0.3" />
    </svg>
  );
}
