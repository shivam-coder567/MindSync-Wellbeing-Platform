import type { InfinityPuzzle } from "./infinityPuzzle";
import type { ThemeColors } from "./hexTypes";
import InfinityTile from "./InfinityTile";

interface InfinityBoardProps {
  puzzle: InfinityPuzzle;
  theme: ThemeColors;
  tileSize?: number;
  selectedHex?: {
    q: number;
    r: number;
  } | null;
  onRotate: (q: number, r: number) => void;
}

export default function InfinityBoard({
  puzzle,
  theme,
  tileSize = 52,
  selectedHex = null,
  onRotate,
}: InfinityBoardProps) {
  const spacingX = tileSize * 1.55;
  const spacingY = tileSize * 1.35;

  const width = puzzle.width * spacingX + tileSize * 2;

  const height = puzzle.height * spacingY + tileSize * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      role="application"
      aria-label={`${puzzle.name} Infinity Flow puzzle`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: "block",
        maxWidth: "100%",
        maxHeight: "100%",
        overflow: "visible",
      }}
    >
      <g transform={`translate(${tileSize}, ${tileSize})`}>
        {puzzle.tiles.map((tile: InfinityPuzzle["tiles"][number]) => {
          const x = tile.hex.q * spacingX;

          const y = tile.hex.r * spacingY + (tile.hex.q % 2) * (spacingY / 2);

          return (
            <g
              key={`${tile.hex.q}-${tile.hex.r}`}
              transform={`translate(${x}, ${y})`}
            >
              <InfinityTile
                tile={tile}
                theme={theme}
                tileSize={tileSize}
                isSelected={
                  selectedHex?.q === tile.hex.q && selectedHex?.r === tile.hex.r
                }
                onRotate={onRotate}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
