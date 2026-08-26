import type { InfinityPuzzle, ThemeColors } from "./hexTypes";
import InfinityTile from "./InfinityTile";
interface Props {
  puzzle: InfinityPuzzle;
  theme: ThemeColors;
  tileSize?: number;
  selected?: { q: number; r: number } | null;
  hint?: { q: number; r: number } | null;
  onRotate: (q: number, r: number) => void;
}
export default function HexBoard({
  puzzle,
  theme,
  tileSize = 58,
  selected = null,
  hint = null,
  onRotate,
}: Props) {
  const pad = tileSize * 1.5,
    pts = puzzle.tiles.map((t) => ({
      x: tileSize * Math.sqrt(3) * (t.hex.q + t.hex.r / 2),
      y: tileSize * 1.5 * t.hex.r,
    })),
    minX = Math.min(...pts.map((p) => p.x)) - pad,
    maxX = Math.max(...pts.map((p) => p.x)) + pad,
    minY = Math.min(...pts.map((p) => p.y)) - pad,
    maxY = Math.max(...pts.map((p) => p.y)) + pad;
  return (
    <div className="infinity-board-shell">
      <svg
        className="infinity-board"
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      >
        <ellipse
          cx={(minX + maxX) / 2}
          cy={(minY + maxY) / 2}
          rx={(maxX - minX) * 0.38}
          ry={(maxY - minY) * 0.38}
          fill={theme.glow}
          opacity=".045"
        />
        {puzzle.tiles.map((t) => (
          <InfinityTile
            key={`${t.hex.q}-${t.hex.r}`}
            tile={t}
            theme={theme}
            tileSize={tileSize}
            isSelected={selected?.q === t.hex.q && selected?.r === t.hex.r}
            isHint={hint?.q === t.hex.q && hint?.r === t.hex.r}
            onRotate={onRotate}
          />
        ))}
      </svg>
    </div>
  );
}
