export default function HubGarden() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="hg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8e4d0" />
          <stop offset="100%" stopColor="#c4d4b8" />
        </linearGradient>
        <linearGradient id="hg-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8c8ac" />
          <stop offset="100%" stopColor="#a0b498" />
        </linearGradient>
        <radialGradient id="hg-water" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#94bcc8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#78a8b8" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="320" height="200" fill="url(#hg-sky)" />

      {/* Distant hills */}
      <ellipse cx="80" cy="120" rx="120" ry="40" fill="#b0c4a4" fillOpacity="0.4" />
      <ellipse cx="260" cy="125" rx="100" ry="35" fill="#a8bca0" fillOpacity="0.35" />

      {/* Ground */}
      <path d="M0 130 Q80 120 160 128 Q240 136 320 125 L320 200 L0 200Z" fill="url(#hg-ground)" />

      {/* Ground texture details */}
      <path d="M20 155 Q30 150 40 155 Q30 158 20 155Z" fill="#8aa88c" fillOpacity="0.3" />
      <path d="M100 160 Q110 155 120 160 Q110 163 100 160Z" fill="#7a9a7c" fillOpacity="0.25" />
      <path d="M200 152 Q210 147 220 152 Q210 155 200 152Z" fill="#8aa88c" fillOpacity="0.2" />
      <path d="M280 158 Q290 153 300 158 Q290 161 280 158Z" fill="#7a9a7c" fillOpacity="0.2" />

      {/* Water pond */}
      <ellipse cx="220" cy="160" rx="55" ry="22" fill="url(#hg-water)" />
      <ellipse cx="218" cy="158" rx="40" ry="14" fill="#a8d0dc" fillOpacity="0.2" />

      {/* Stones */}
      <ellipse cx="100" cy="148" rx="14" ry="10" fill="#8a9488" />
      <ellipse cx="100" cy="147" rx="12" ry="8" fill="#96a094" />
      <ellipse cx="98" cy="145" rx="6" ry="4" fill="#a4aea2" fillOpacity="0.5" />

      <ellipse cx="140" cy="155" rx="10" ry="7" fill="#7a8478" />
      <ellipse cx="140" cy="154" rx="8" ry="5.5" fill="#8a9488" />

      {/* Plants */}
      <path d="M60 148 Q62 130 58 120 Q64 125 66 135 Q68 128 72 118 Q70 132 68 148Z" fill="#5a8a5e" fillOpacity="0.8" />
      <path d="M62 148 Q64 135 60 128" stroke="#4a7a4e" strokeWidth="1" strokeOpacity="0.4" fill="none" />

      <path d="M170 145 Q172 128 168 118 Q174 123 176 133 Q178 126 182 116 Q180 130 178 145Z" fill="#6a9a6e" fillOpacity="0.75" />

      {/* Flowers */}
      <circle cx="155" cy="140" r="4" fill="#d4a0b0" fillOpacity="0.8" />
      <circle cx="155" cy="140" r="2" fill="#e8b8c4" />
      <path d="M155 144 L155 152" stroke="#5a8a5e" strokeWidth="1" strokeOpacity="0.5" />

      <circle cx="260" cy="145" r="3.5" fill="#c8a8b4" fillOpacity="0.7" />
      <circle cx="260" cy="145" r="1.8" fill="#dcc0c8" />

      {/* Small grass tufts */}
      <path d="M35 162 L37 155 L39 162" stroke="#6a9a6e" strokeWidth="0.8" strokeOpacity="0.4" fill="none" />
      <path d="M310 155 L312 148 L314 155" stroke="#5a8a5e" strokeWidth="0.8" strokeOpacity="0.35" fill="none" />

      {/* Lantern silhouette */}
      <rect x="275" y="130" width="6" height="12" rx="1" fill="#8a8478" fillOpacity="0.25" />
      <path d="M273 130 L281 130 L279 126 L275 126Z" fill="#8a8478" fillOpacity="0.2" />
    </svg>
  );
}
