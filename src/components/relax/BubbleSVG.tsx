/**
 * BubbleSVG — Premium glass bubble with translucent layers.
 *
 * Each bubble uses a unique ID based on a nonce to avoid
 * gradient ID collisions when multiple bubbles render.
 */

interface Props {
  hue: number;
  size: number;
  nonce: string;
}

export default function BubbleSVG({ hue, size, nonce }: Props) {
  const id = `bg-${nonce}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        {/* Main glass body */}
        <radialGradient id={`${id}-body`} cx="40%" cy="35%" r="52%">
          <stop offset="0%" stopColor={`hsla(${hue}, 38%, 90%, 0.28)`} />
          <stop offset="30%" stopColor={`hsla(${hue}, 32%, 80%, 0.16)`} />
          <stop offset="65%" stopColor={`hsla(${hue}, 28%, 70%, 0.08)`} />
          <stop offset="100%" stopColor={`hsla(${hue}, 22%, 60%, 0.02)`} />
        </radialGradient>

        {/* Inner glow */}
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="42%">
          <stop offset="0%" stopColor={`hsla(${hue}, 32%, 82%, 0.12)`} />
          <stop offset="100%" stopColor={`hsla(${hue}, 28%, 68%, 0)`} />
        </radialGradient>

        {/* Specular highlight */}
        <radialGradient id={`${id}-spec`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.50" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Rim light gradient */}
        <linearGradient id={`${id}-rim`} x1="25%" y1="80%" x2="75%" y2="100%">
          <stop offset="0%" stopColor={`hsla(${hue}, 35%, 80%, 0)`} />
          <stop offset="50%" stopColor={`hsla(${hue}, 35%, 80%, 0.12)`} />
          <stop offset="100%" stopColor={`hsla(${hue}, 35%, 80%, 0)`} />
        </linearGradient>

        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Outer atmospheric glow */}
      <circle cx="50" cy="50" r="49" fill={`hsla(${hue}, 30%, 75%, 0.03)`} />

      {/* Main glass body */}
      <circle cx="50" cy="50" r="44" fill={`url(#${id}-body)`} />

      {/* Inner glow */}
      <circle cx="50" cy="50" r="36" fill={`url(#${id}-glow)`} />

      {/* Rim light — bottom edge */}
      <circle cx="50" cy="50" r="44" fill={`url(#${id}-rim)`} />

      {/* Subtle edge ring */}
      <circle
        cx="50" cy="50" r="44"
        stroke={`hsla(${hue}, 30%, 75%, 0.10)`}
        strokeWidth="0.6"
        fill="none"
      />

      {/* Upper highlight arc */}
      <path
        d="M30 36 Q38 20 52 16 Q66 20 74 36"
        stroke="#ffffff"
        strokeOpacity="0.10"
        strokeWidth="0.6"
        fill="none"
      />

      {/* Primary specular highlight — upper-left */}
      <ellipse
        cx="40" cy="33"
        rx="14" ry="10"
        fill={`url(#${id}-spec)`}
        transform="rotate(-8 40 33)"
      />

      {/* Bright core of highlight */}
      <ellipse
        cx="38" cy="30"
        rx="6" ry="4"
        fill="#ffffff"
        fillOpacity="0.25"
        transform="rotate(-8 38 30)"
      />

      {/* Tiny hot spot */}
      <circle cx="36" cy="28" r="2" fill="#ffffff" fillOpacity="0.30" />

      {/* Secondary reflection — lower-right */}
      <circle cx="62" cy="66" r="3" fill="#ffffff" fillOpacity="0.06" />

      {/* Internal subtle texture */}
      <path
        d="M42 40 Q48 50 44 62"
        stroke={`hsla(${hue}, 30%, 80%, 0.06)`}
        strokeWidth="0.4"
        fill="none"
        filter={`url(#${id}-blur)`}
      />

      {/* Tiny internal motes */}
      <circle cx="54" cy="44" r="0.7" fill="#ffffff" fillOpacity="0.08" />
      <circle cx="44" cy="56" r="0.5" fill="#ffffff" fillOpacity="0.06" />
    </svg>
  );
}
