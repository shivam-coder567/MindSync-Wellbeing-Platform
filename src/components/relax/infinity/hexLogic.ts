import type { Hex, Mask, InfinityTile } from "./hexTypes";
export const HEX_SIZE = 54;
export function hexToPixel(h: Hex, size = HEX_SIZE) {
  return { x: size * Math.sqrt(3) * (h.q + h.r / 2), y: size * 1.5 * h.r };
}
export function hexPath(cx: number, cy: number, r: number) {
  const p: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${p.join(" L ")} Z`;
}
export function rotateMask(mask: Mask, steps: number) {
  let n = ((steps % 6) + 6) % 6,
    r = mask;
  while (n--) {
    let x = 0;
    for (let d = 0; d < 6; d++) if (r & (1 << d)) x |= 1 << ((d + 1) % 6);
    r = x;
  }
  return r;
}
export function hasConn(mask: Mask, d: number) {
  return !!(mask & (1 << d));
}
export function connectionPath(
  cx: number,
  cy: number,
  d: number,
  inner: number,
) {
  const a = (Math.PI / 180) * (60 * d - 30),
    ex = cx + inner * Math.cos(a),
    ey = cy + inner * Math.sin(a),
    c = inner * 0.45;
  return `M ${cx} ${cy} Q ${cx + c * Math.cos(a)} ${cy + c * Math.sin(a)} ${ex} ${ey}`;
}
export function isSolved(t: InfinityTile[]) {
  return t.every((x) => x.mask === x.solvedMask);
}
export function countMoves(t: InfinityTile[]) {
  return t.reduce((s, x) => s + x.rotation, 0);
}
