export default function GardenScene() {
  return (
    <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4e2cc" />
          <stop offset="60%" stopColor="#c8d8bc" />
          <stop offset="100%" stopColor="#bccca8" />
        </linearGradient>
        <linearGradient id="gs-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b0c4a0" />
          <stop offset="40%" stopColor="#a4b898" />
          <stop offset="100%" stopColor="#98ac8c" />
        </linearGradient>
        <radialGradient id="gs-water" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#a0c8d4" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#88b4c4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#78a4b4" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="gs-pond-shine" cx="40%" cy="30%" r="40%">
          <stop offset="0%" stopColor="#c0dce4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#90b8c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gs-hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8bca0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#98ac90" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="gs-hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9cb494" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8ca884" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="800" height="600" fill="url(#gs-sky)" />

      {/* Distant hills */}
      <ellipse cx="200" cy="310" rx="300" ry="80" fill="url(#gs-hill1)" />
      <ellipse cx="600" cy="320" rx="280" ry="70" fill="url(#gs-hill2)" />
      <ellipse cx="400" cy="330" rx="350" ry="60" fill="#a4b898" fillOpacity="0.2" />

      {/* Ground layers */}
      <path d="M0 340 Q100 325 200 335 Q350 350 500 330 Q650 315 800 335 L800 600 L0 600Z" fill="url(#gs-ground)" />
      <path d="M0 370 Q150 355 300 365 Q500 380 700 360 L800 365 L800 600 L0 600Z" fill="#98ac8c" fillOpacity="0.4" />
      <path d="M0 410 Q200 395 400 405 Q600 415 800 400 L800 600 L0 600Z" fill="#8ca080" fillOpacity="0.3" />

      {/* Ground texture — subtle organic marks */}
      <ellipse cx="120" cy="420" rx="30" ry="8" fill="#8aa88c" fillOpacity="0.15" />
      <ellipse cx="350" cy="440" rx="25" ry="6" fill="#7a987c" fillOpacity="0.12" />
      <ellipse cx="580" cy="415" rx="35" ry="7" fill="#8aa88c" fillOpacity="0.1" />
      <ellipse cx="700" cy="435" rx="20" ry="5" fill="#7a987c" fillOpacity="0.1" />

      {/* Water pond */}
      <ellipse cx="550" cy="460" rx="120" ry="45" fill="url(#gs-water)" />
      <ellipse cx="545" cy="455" rx="80" ry="28" fill="url(#gs-pond-shine)" />

      {/* Water ripple lines */}
      <ellipse cx="540" cy="458" rx="50" ry="12" fill="none" stroke="#b0d4dc" strokeOpacity="0.2" strokeWidth="0.5" />
      <ellipse cx="560" cy="465" rx="35" ry="8" fill="none" stroke="#a0c4d0" strokeOpacity="0.15" strokeWidth="0.4" />

      {/* Moss patches */}
      <ellipse cx="180" cy="480" rx="60" ry="20" fill="#7aaa7e" fillOpacity="0.15" />
      <ellipse cx="400" cy="500" rx="80" ry="18" fill="#6a9a6e" fillOpacity="0.12" />
      <ellipse cx="680" cy="470" rx="50" ry="15" fill="#7aaa7e" fillOpacity="0.1" />

      {/* Decorative grass tufts */}
      <g opacity="0.3">
        <path d="M80 430 L82 415 L84 430" stroke="#6a9a6e" strokeWidth="1" fill="none" />
        <path d="M85 428 L87 412 L89 428" stroke="#5a8a5e" strokeWidth="0.8" fill="none" />
        <path d="M75 432 L77 418 L79 432" stroke="#7aaa7e" strokeWidth="0.8" fill="none" />
      </g>
      <g opacity="0.25">
        <path d="M720 445 L722 430 L724 445" stroke="#6a9a6e" strokeWidth="0.8" fill="none" />
        <path d="M725 443 L727 428 L729 443" stroke="#5a8a5e" strokeWidth="0.7" fill="none" />
      </g>

      {/* Small rocks scattered */}
      <ellipse cx="250" cy="470" rx="8" ry="5" fill="#8a9488" fillOpacity="0.4" />
      <ellipse cx="450" cy="490" rx="6" ry="4" fill="#7a8478" fillOpacity="0.35" />
      <ellipse cx="650" cy="480" rx="7" ry="4.5" fill="#8a9488" fillOpacity="0.3" />

      {/* Atmospheric particles */}
      <circle cx="150" cy="280" r="1.2" fill="#7aaa7e" fillOpacity="0.2" />
      <circle cx="400" cy="260" r="0.8" fill="#6a9a6e" fillOpacity="0.18" />
      <circle cx="650" cy="290" r="1" fill="#8aba8e" fillOpacity="0.15" />
      <circle cx="300" cy="310" r="0.6" fill="#7aaa7e" fillOpacity="0.15" />
      <circle cx="550" cy="270" r="0.9" fill="#6a9a6e" fillOpacity="0.12" />
    </svg>
  );
}
