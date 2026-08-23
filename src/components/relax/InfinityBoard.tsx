import { useCallback, useRef, useEffect } from "react";
import InfinityTile from "./InfinityTile";
import type { Puzzle } from "./infinityPuzzle";

interface InfinityBoardProps {
  puzzle: Puzzle;
  hintedTile: { row: number; col: number } | null;
  onRotate: (row: number, col: number) => void;
}

export default function InfinityBoard({
  puzzle,
  hintedTile,
  onRotate,
}: InfinityBoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation between tiles
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains("inf-tile")) return;

      const tiles = Array.from(
        gridRef.current?.querySelectorAll(".inf-tile") ?? []
      );
      const idx = tiles.indexOf(target);
      if (idx === -1) return;

      const size = puzzle.size;
      const row = Math.floor(idx / size);
      const col = idx % size;

      let nextRow = row;
      let nextCol = col;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          nextCol = Math.min(col + 1, size - 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextCol = Math.max(col - 1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          nextRow = Math.min(row + 1, size - 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          nextRow = Math.max(row - 1, 0);
          break;
        default:
          return;
      }

      const nextIdx = nextRow * size + nextCol;
      if (tiles[nextIdx]) {
        (tiles[nextIdx] as HTMLElement).focus();
      }
    },
    [puzzle.size]
  );

  return (
    <div
      ref={gridRef}
      className="inf-board"
      role="grid"
      aria-label="Infinity Flow puzzle board"
      onKeyDown={handleGridKeyDown}
      style={
        {
          "--board-size": puzzle.size,
        } as React.CSSProperties
      }
    >
      {puzzle.tiles.map((row, r) =>
        row.map((tile, c) => (
          <InfinityTile
            key={`${r}-${c}`}
            connections={tile.connections}
            rotation={tile.rotation}
            row={r}
            col={c}
            isHinted={hintedTile?.row === r && hintedTile?.col === c}
            isSolved={tile.connections === tile.solvedConnections}
            onRotate={onRotate}
          />
        ))
      )}
    </div>
  );
}
