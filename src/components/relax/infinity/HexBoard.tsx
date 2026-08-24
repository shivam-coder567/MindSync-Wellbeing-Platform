import { memo, useMemo } from "react";
import type { ThemeColors } from "./hexTypes";
import { hexToPixel } from "./hexLogic";
import HexTile from "./HexTile";

interface TileData {
  hex: { q: number; r: number };
  currentMask: number;
  solvedMask: number;
  rotation: number;
}

interface HexBoardProps {
  tiles: TileData[];
  theme: ThemeColors;
  onRotate: (q: number, r: number) => void;
  solved: boolean;
}

const HexBoard = memo(function HexBoard({ tiles, theme, onRotate, solved }: HexBoardProps) {
  const tileSize = 36;

  // Compute bounds and center
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const t of tiles) {
      const { x, y } = hexToPixel(t.hex, tileSize);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const pad = tileSize * 2;
    return {
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
      offsetX: -minX + pad,
      offsetY: -minY + pad,
    };
  }, [tiles, tileSize]);

  return (
    <svg
      className="hex-board-svg"
      viewBox={`0 0 ${bounds.width} ${bounds.height}`}
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <filter id="hex-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={`translate(${bounds.offsetX}, ${bounds.offsetY})`}>
        {tiles.map((t) => (
          <HexTile
            key={`${t.hex.q},${t.hex.r}`}
            hex={t.hex}
            currentMask={t.currentMask}
            solvedMask={t.solvedMask}
            rotation={t.rotation}
            theme={theme}
            tileSize={tileSize}
            isSelected={false}
            onRotate={onRotate}
          />
        ))}
      </g>
    </svg>
  );
});

export default HexBoard;
