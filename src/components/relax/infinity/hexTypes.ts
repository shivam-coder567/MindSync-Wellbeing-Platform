export type Mask = number;
export interface Hex {
  q: number;
  r: number;
}
export interface ThemeColors {
  background: string;
  glow: string;
  surface: string;
  tile: string;
  tileSelected: string;
  border: string;
  line: string;
  lineActive: string;
  text: string;
  muted: string;
  accent: string;
}
export interface InfinityTile {
  hex: Hex;
  solvedMask: Mask;
  mask: Mask;
  rotation: number;
  initialRotation: number;
}
export interface InfinityPuzzle {
  id: number;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  tiles: InfinityTile[];
}
