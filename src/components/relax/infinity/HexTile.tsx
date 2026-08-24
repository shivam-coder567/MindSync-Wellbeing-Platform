import { memo, useCallback } from "react";
import type { Hex, Mask, ThemeColors } from "./hexTypes";
import { hasConn } from "./hexTypes";
import { hexToPixel, hexPath } from "./hexLogic";

interface HexTileProps {
  hex: Hex;
  currentMask: Mask;
  solvedMask: Mask;
  rotation: number;
  theme: ThemeColors;
  tileSize: number;
  isSelected: boolean;
  onRotate: (q: number, r: number) => void;
}

/** Draw connection paths for a hex tile */
function drawConnections(cx: number, cy: number, mask: Mask, size: number, isSolved: boolean, theme: ThemeColors): React.ReactNode {
  const paths: React.ReactNode[] = [];
  const inner = size * 0.42;

  for (let d = 0; d < 6; d++) {
    if (!hasConn(mask, d as any)) continue;
    const angle = (Math.PI / 180) * (60 * d - 30);
    const ex = cx + inner * Math.cos(angle);
    const ey = cy + inner * Math.sin(angle);

    // Line from center to edge
    paths.push(
      <line
        key={`l${d}`}
        x1={cx} y1={cy} x2={ex} y2={ey}
        stroke={isSolved ? theme.lineActive : theme.line}
        strokeWidth={3.5}
        strokeLinecap="round"
        opacity={isSolved ? 1 : 0.75}
      />
    );

    // Glow
    paths.push(
      <line
        key={`g${d}`}
        x1={cx} y1={cy} x2={ex} y2={ey}
        stroke={theme.glow}
        strokeWidth={7}
        strokeLinecap="round"
        opacity={isSolved ? 0.25 : 0.08}
      />
    );
  }

  // Center dot
  if (mask !== 0) {
    paths.push(
      <circle key="center" cx={cx} cy={cy} r={2.5}
        fill={isSolved ? theme.lineActive : theme.line}
        opacity={isSolved ? 0.9 : 0.6}
      />
    );
  }

  return <>{paths}</>;
}

const HexTile = memo(function HexTile({
  hex,
  currentMask,
  solvedMask,
  rotation,
  theme,
  tileSize,
  isSelected,
  onRotate,
}: HexTileProps) {
  const { x, y } = hexToPixel(hex, tileSize);
  const isSolved = currentMask === solvedMask;
  const rotationDeg = rotation * 60;

  const handleClick = useCallback(() => {
    onRotate(hex.q, hex.r);
  }, [hex.q, hex.r, onRotate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRotate(hex.q, hex.r);
      }
    },
    [hex.q, hex.r, onRotate]
  );

  return (
    <g
      className={`hex-tile ${isSelected ? "hex-tile-selected" : ""}`}
      style={{ cursor: "pointer" }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Hex tile at ${hex.q},${hex.r}, rotation ${rotationDeg} degrees`}
    >
      {/* Hex background */}
      <path
        d={hexPath(x, y, tileSize * 0.92)}
        fill={isSolved ? theme.surface : `${theme.surface}dd`}
        stroke={isSelected ? theme.glow : `${theme.line}22`}
        strokeWidth={isSelected ? 2 : 1}
      />

      {/* Connections — rotate group */}
      <g transform={`rotate(${rotationDeg} ${x} ${y})`}>
        {drawConnections(x, y, currentMask, tileSize, isSolved, theme)}
      </g>
    </g>
  );
});

export default HexTile;
