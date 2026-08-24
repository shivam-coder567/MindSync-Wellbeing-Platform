export type GardenCategory =
  | "all"
  | "stones"
  | "pebbles"
  | "shells"
  | "flowers"
  | "plants"
  | "moss"
  | "nature"
  | "decor";

export type ToolType = GardenCategory | "rake";

export interface GardenObjectDef {
  id: string;
  name: string;
  category: Exclude<GardenCategory, "all">;
  /** SVG render function — receives size and returns SVG content */
  render: (size: number) => React.ReactNode;
  /** Thumbnail size for toolbar */
  thumbSize?: number;
}

export interface PlacedObject {
  id: string;
  defId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface RakeStroke {
  id: string;
  points: { x: number; y: number }[];
  width: number;
}

export interface GardenState {
  objects: PlacedObject[];
  rakeStrokes: RakeStroke[];
}

export interface HistoryEntry {
  objects: PlacedObject[];
  rakeStrokes: RakeStroke[];
}

export interface Preset {
  name: string;
  description: string;
  objects: Omit<PlacedObject, "id">[];
}
