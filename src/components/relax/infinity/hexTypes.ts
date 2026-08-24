/** Hex grid types for Infinity Flow */

/** Axial coordinates (q, r) */
export interface Hex {
  q: number;
  r: number;
}

/** Direction indices: 0=NE, 1=E, 2=SE, 3=SW, 4=W, 5=NW */
export type Dir = 0 | 1 | 2 | 3 | 4 | 5;

export function opposite(d: Dir): Dir {
  return ((d + 3) % 6) as Dir;
}

export function rotateDir(d: Dir, steps: number): Dir {
  return ((d + steps) % 6) as Dir;
}

/** Connection mask — bit i set means open in direction i */
export type Mask = number;

export function hasConn(mask: Mask, d: Dir): boolean {
  return (mask & (1 << d)) !== 0;
}

export function addConn(mask: Mask, d: Dir): Mask {
  return mask | (1 << d);
}

export function rotateMask(mask: Mask, steps: number): Mask {
  let r = mask;
  for (let i = 0; i < (steps % 6); i++) {
    let next = 0;
    for (let d = 0; d < 6; d++) {
      if (r & (1 << d)) next |= 1 << ((d + 1) % 6);
    }
    r = next;
  }
  return r;
}

export function connCount(mask: Mask): number {
  let c = 0;
  for (let i = 0; i < 6; i++) if (mask & (1 << i)) c++;
  return c;
}

export interface HexTile {
  hex: Hex;
  solvedMask: Mask;
  rotation: number; // 0-5 (number of 60° steps from solved)
}

export interface HexLevel {
  id: number;
  name: string;
  tiles: { q: number; r: number; mask: Mask }[];
  theme: number; // index into themes
}

export interface GameState {
  level: number;
  tiles: { hex: Hex; currentMask: Mask; solvedMask: Mask; rotation: number }[];
  completed: number[]; // completed level IDs
}

export interface ThemeColors {
  name: string;
  bg: string;
  surface: string;
  line: string;
  lineActive: string;
  glow: string;
  text: string;
  textMuted: string;
  accent: string;
}
