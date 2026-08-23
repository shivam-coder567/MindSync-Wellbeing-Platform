type ObjectType = "stone" | "plant" | "flower";

interface Props {
  type: ObjectType;
  scale?: number;
}

function StoneSVG({ scale = 1 }: { scale: number }) {
  return (
    <svg width={36 * scale} height={28 * scale} viewBox="0 0 36 28" fill="none">
      {/* Shadow */}
      <ellipse cx="18" cy="24" rx="14" ry="3.5" fill="#5a6a54" fillOpacity="0.12" />
      {/* Stone body */}
      <ellipse cx="18" cy="16" rx="14" ry="10" fill="#7a8478" />
      <ellipse cx="18" cy="15" rx="12.5" ry="8.5" fill="#8a9488" />
      {/* Surface highlight */}
      <ellipse cx="15" cy="12" rx="7" ry="4.5" fill="#9aa498" fillOpacity="0.6" />
      <ellipse cx="13" cy="11" rx="3.5" ry="2" fill="#a8b2a6" fillOpacity="0.4" />
      {/* Edge detail */}
      <path d="M6 16 Q8 8 18 6 Q28 8 30 16" fill="none" stroke="#6a7a64" strokeWidth="0.4" strokeOpacity="0.3" />
    </svg>
  );
}

function PlantSVG({ scale = 1 }: { scale: number }) {
  return (
    <svg width={32 * scale} height={44 * scale} viewBox="0 0 32 44" fill="none">
      {/* Shadow */}
      <ellipse cx="16" cy="41" rx="10" ry="2.5" fill="#4a6a44" fillOpacity="0.1" />
      {/* Stem */}
      <path d="M16 40 C16 40 15.5 28 16 24" stroke="#4a7a4e" strokeWidth="1.5" strokeLinecap="round" />
      {/* Back leaves */}
      <path d="M16 28 C10 24 6 16 8 12 C10 8 14 10 16 18" fill="#4a8a50" fillOpacity="0.7" />
      <path d="M16 26 C22 22 26 14 24 10 C22 6 18 8 16 16" fill="#3a7a44" fillOpacity="0.65" />
      {/* Front leaves */}
      <path d="M16 32 C11 30 8 24 9 20 C10 16 14 18 16 25" fill="#5a9a5e" fillOpacity="0.85" />
      <path d="M16 30 C21 28 24 22 23 18 C22 14 18 16 16 23" fill="#4a8a4e" fillOpacity="0.8" />
      {/* Top bud */}
      <circle cx="16" cy="10" r="2.5" fill="#3a7a44" fillOpacity="0.5" />
      <circle cx="16" cy="9.5" r="1.5" fill="#4a8a4e" fillOpacity="0.6" />
    </svg>
  );
}

function FlowerSVG({ scale = 1 }: { scale: number }) {
  return (
    <svg width={32 * scale} height={48 * scale} viewBox="0 0 32 48" fill="none">
      {/* Shadow */}
      <ellipse cx="16" cy="45" rx="8" ry="2" fill="#5a6a54" fillOpacity="0.1" />
      {/* Stem */}
      <path d="M16 44 C16 44 15.5 30 16 26" stroke="#4a7a4e" strokeWidth="1.2" strokeLinecap="round" />
      {/* Leaf on stem */}
      <path d="M16 34 C12 32 10 28 11 26 C12 24 15 25 16 30" fill="#5a9a5e" fillOpacity="0.6" />
      {/* Petals */}
      <ellipse cx="12" cy="18" rx="4.5" ry="6" fill="#d4a0b0" fillOpacity="0.8" transform="rotate(-15 12 18)" />
      <ellipse cx="20" cy="18" rx="4.5" ry="6" fill="#d4a0b0" fillOpacity="0.75" transform="rotate(15 20 18)" />
      <ellipse cx="16" cy="14" rx="4" ry="5.5" fill="#dca8b8" fillOpacity="0.85" />
      <ellipse cx="13" cy="20" rx="3.5" ry="5" fill="#c898a8" fillOpacity="0.7" transform="rotate(-25 13 20)" />
      <ellipse cx="19" cy="20" rx="3.5" ry="5" fill="#c898a8" fillOpacity="0.65" transform="rotate(25 19 20)" />
      {/* Center */}
      <circle cx="16" cy="17" r="3" fill="#e8c0c8" />
      <circle cx="16" cy="16.5" r="1.8" fill="#f0d0d8" />
      <circle cx="15.5" cy="16" r="0.8" fill="#fff" fillOpacity="0.4" />
    </svg>
  );
}

const RENDERERS: Record<ObjectType, React.FC<{ scale: number }>> = {
  stone: StoneSVG,
  plant: PlantSVG,
  flower: FlowerSVG,
};

export default function GardenObjectSVG({ type, scale = 1 }: Props) {
  const Renderer = RENDERERS[type];
  return <Renderer scale={scale} />;
}

export const GARDEN_OBJECT_TYPES = ["stone", "plant", "flower"] as const;
