import type { InfinityPuzzle, InfinityTile, Mask } from "./hexTypes";
export type { Hex, InfinityPuzzle, InfinityTile, Mask } from "./hexTypes";
import { rotateMask } from "./hexLogic";
const t = (q: number, r: number, m: Mask, rot: number): InfinityTile => ({
  hex: { q, r },
  solvedMask: m,
  rotation: rot,
  initialRotation: rot,
  mask: rotateMask(m, rot),
});
const l1: InfinityPuzzle = {
  id: 1,
  name: "First Flow",
  subtitle: "Start gently. Connect every path.",
  width: 3,
  height: 3,
  tiles: [
    t(0, 0, 3, 2),
    t(1, 0, 13, 4),
    t(2, 0, 48, 1),
    t(0, 1, 19, 3),
    t(1, 1, 63, 1),
    t(2, 1, 38, 4),
    t(0, 2, 6, 5),
    t(1, 2, 28, 2),
    t(2, 2, 48, 3),
  ],
};
const l2: InfinityPuzzle = {
  id: 2,
  name: "Ocean Loop",
  subtitle: "Follow the flow and slow your breathing.",
  width: 4,
  height: 4,
  tiles: Array.from({ length: 16 }, (_, i) => {
    const q = i % 4,
      r = Math.floor(i / 4),
      m = [3, 15, 13, 48, 19, 63, 47, 38, 6, 59, 61, 48, 3, 13, 19, 48][i];
    return t(q, r, m, (i * 3 + 1) % 6);
  }),
};
const l3: InfinityPuzzle = {
  id: 3,
  name: "Deep Garden",
  subtitle: "A deeper pattern. Take your time.",
  width: 4,
  height: 4,
  tiles: Array.from({ length: 16 }, (_, i) => {
    const q = i % 4,
      r = Math.floor(i / 4),
      m = [3, 15, 15, 48, 19, 63, 63, 38, 19, 63, 63, 38, 6, 55, 15, 48][i];
    return t(q, r, m, (i * 5 + 2) % 6);
  }),
};
export const infinityLevels = [l1, l2, l3];
export const levels = infinityLevels;
const clone = (p: InfinityPuzzle): InfinityPuzzle => ({
  ...p,
  tiles: p.tiles.map((x) => ({ ...x, hex: { ...x.hex } })),
});
export function getPuzzleLevel(id: number) {
  return clone(infinityLevels.find((x) => x.id === id) ?? l1);
}
export function getNextLevel(id: number) {
  const i = infinityLevels.findIndex((x) => x.id === id);
  return i >= 0 && i < infinityLevels.length - 1
    ? clone(infinityLevels[i + 1])
    : null;
}
export function rotatePuzzleTile(
  p: InfinityPuzzle,
  q: number,
  r: number,
): InfinityPuzzle {
  return {
    ...p,
    tiles: p.tiles.map((x) =>
      x.hex.q === q && x.hex.r === r
        ? {
            ...x,
            rotation: (x.rotation + 1) % 6,
            mask: rotateMask(x.solvedMask, (x.rotation + 1) % 6),
          }
        : x,
    ),
  };
}
export function isPuzzleSolved(p: InfinityPuzzle) {
  return p.tiles.every((x) => x.mask === x.solvedMask);
}
export function countPuzzleMoves(p: InfinityPuzzle) {
  return p.tiles.reduce((s, x) => s + x.rotation, 0);
}
export function resetPuzzle(id: number) {
  return getPuzzleLevel(id);
}
export function hasConnection(mask: Mask, d: number) {
  return !!(mask & (1 << d));
}
