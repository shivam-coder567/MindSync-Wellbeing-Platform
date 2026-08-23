import { useCallback, memo } from "react";
import { hasConnection } from "./infinityPuzzle";

interface InfinityTileProps {
  connections: number;
  rotation: number;
  row: number;
  col: number;
  isHinted: boolean;
  isSolved: boolean;
  onRotate: (row: number, col: number) => void;
}

const TILE_SIZE = 100;
const CENTER = 50;
const LINE_LEN = 36;
const STROKE_WIDTH = 5;

/** SVG tile for the Infinity Flow puzzle */
const InfinityTile = memo(function InfinityTile({
  connections,
  rotation,
  row,
  col,
  isHinted,
  isSolved,
  onRotate,
}: InfinityTileProps) {
  const handleClick = useCallback(() => {
    onRotate(row, col);
  }, [onRotate, row, col]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRotate(row, col);
      }
    },
    [onRotate, row, col]
  );

  // Build SVG paths from connections
  const paths: string[] = [];
  if (hasConnection(connections, 0)) paths.push(`M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - LINE_LEN}`);
  if (hasConnection(connections, 1)) paths.push(`M ${CENTER} ${CENTER} L ${CENTER + LINE_LEN} ${CENTER}`);
  if (hasConnection(connections, 2)) paths.push(`M ${CENTER} ${CENTER} L ${CENTER} ${CENTER + LINE_LEN}`);
  if (hasConnection(connections, 3)) paths.push(`M ${CENTER} ${CENTER} L ${CENTER - LINE_LEN} ${CENTER}`);

  // Rotation animation
  const rotationDeg = rotation;

  // Glow color based on hint/solved state
  const glowColor = isSolved
    ? "rgba(126, 203, 161, 0.6)"
    : isHinted
    ? "rgba(220, 200, 130, 0.7)"
    : "rgba(160, 210, 180, 0.25)";

  const lineColor = isSolved
    ? "#a8e6c3"
    : isHinted
    ? "#e8d99a"
    : "#8fbfa8";

  const highlightColor = isSolved
    ? "rgba(168, 230, 195, 0.4)"
    : isHinted
    ? "rgba(232, 217, 154, 0.3)"
    : "rgba(180, 220, 200, 0.15)";

  return (
    <button
      className="inf-tile"
      role="button"
      tabIndex={0}
      aria-label={`Rotate puzzle tile at row ${row + 1}, column ${col + 1}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        "--tile-rotation": `${rotationDeg}deg`,
        "--tile-glow": glowColor,
      } as React.CSSProperties}
    >
      <svg
        viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`}
        className="inf-tile-svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`tile-glow-${row}-${col}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={highlightColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id={`tile-blur-${row}-${col}`}>
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Subtle cell background */}
        <circle cx={CENTER} cy={CENTER} r={44} fill={`url(#tile-glow-${row}-${col})`} />

        {/* Connection lines — glow layer */}
        {paths.map((d, i) => (
          <path
            key={`glow-${i}`}
            d={d}
            stroke={glowColor}
            strokeWidth={STROKE_WIDTH + 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter={`url(#tile-blur-${row}-${col})`}
            opacity={0.5}
          />
        ))}

        {/* Connection lines — main */}
        {paths.map((d, i) => (
          <path
            key={`line-${i}`}
            d={d}
            stroke={lineColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}

        {/* Connection lines — highlight */}
        {paths.map((d, i) => (
          <path
            key={`highlight-${i}`}
            d={d}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* Center node */}
        {paths.length > 0 && (
          <>
            <circle cx={CENTER} cy={CENTER} r={5} fill={lineColor} opacity={0.8} />
            <circle cx={CENTER} cy={CENTER} r={2.5} fill="rgba(255,255,255,0.4)" />
          </>
        )}
      </svg>
    </button>
  );
});

export default InfinityTile;
