import { memo, useCallback, type KeyboardEvent } from "react";
import type { Hex, Mask, ThemeColors } from "./hexTypes";
import { hasConn, hexPath, connectionPath } from "./hexLogic";
interface Props {
  hex: Hex;
  currentMask: Mask;
  solvedMask: Mask;
  rotation: number;
  theme: ThemeColors;
  tileSize: number;
  isSelected?: boolean;
  isHint?: boolean;
  onRotate: (q: number, r: number) => void;
}
function HexTile({
  hex,
  currentMask,
  solvedMask,
  rotation,
  theme,
  tileSize,
  isSelected = false,
  isHint = false,
  onRotate,
}: Props) {
  const x = tileSize * Math.sqrt(3) * (hex.q + hex.r / 2),
    y = tileSize * 1.5 * hex.r,
    solved = currentMask === solvedMask,
    inner = tileSize * 0.72;
  const click = useCallback(
    () => onRotate(hex.q, hex.r),
    [hex.q, hex.r, onRotate],
  );
  const key = useCallback(
    (e: KeyboardEvent<SVGGElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        click();
      }
    },
    [click],
  );
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Hex tile ${hex.q + 1}, ${hex.r + 1}`}
      className={`infinity-tile${isSelected ? " infinity-tile--selected" : ""}${isHint ? " infinity-tile--hint" : ""}${solved ? " infinity-tile--solved" : ""}`}
      onClick={click}
      onKeyDown={key}
    >
      <path
        d={hexPath(x, y, tileSize * 0.92)}
        fill={isSelected ? theme.tileSelected : theme.tile}
        stroke={isSelected || isHint ? theme.glow : theme.border}
        strokeWidth={isSelected || isHint ? 2.8 : 1.4}
      />
      <g
        transform={`rotate(${rotation * 60} ${x} ${y})`}
        style={{
          transition: "transform 250ms cubic-bezier(.22,.8,.25,1)",
          transformOrigin: `${x}px ${y}px`,
        }}
      >
        {Array.from({ length: 6 }, (_, d) =>
          hasConn(currentMask, d) ? (
            <g key={d}>
              <path
                d={connectionPath(x, y, d, inner)}
                fill="none"
                stroke={theme.glow}
                strokeWidth={tileSize * 0.22}
                strokeLinecap="round"
                opacity={solved ? 0.25 : 0.07}
              />
              <path
                d={connectionPath(x, y, d, inner)}
                fill="none"
                stroke={solved ? theme.lineActive : theme.line}
                strokeWidth={tileSize * 0.105}
                strokeLinecap="round"
              />
            </g>
          ) : null,
        )}
        {currentMask ? (
          <circle
            cx={x}
            cy={y}
            r={tileSize * 0.07}
            fill={solved ? theme.lineActive : theme.line}
          />
        ) : null}
      </g>
      {isHint ? (
        <circle
          cx={x}
          cy={y}
          r={tileSize * 0.82}
          fill="none"
          stroke={theme.glow}
          strokeWidth="3"
          className="infinity-hint-ring"
        />
      ) : null}
    </g>
  );
}
export default memo(HexTile);
