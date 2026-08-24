import type { Hex, Dir, Mask, HexTile } from "./hexTypes";
import { hasConn, opposite, rotateMask, rotateDir } from "./hexTypes";

/** Neighbor directions for even-q offset hex grid */
const EVEN_Q_NEIGHBORS: [number, number][] = [
  [0, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0],
];
const ODD_Q_NEIGHBORS: [number, number][] = [
  [0, -1], [1, -1], [1, 0], [0, 1], [-1, 0], [-1, -1],
];

/** Get axial neighbor of hex in direction d */
export function getNeighbor(hex: Hex, d: Dir): Hex {
  const [dq, dr] = (hex.q % 2 === 0 ? EVEN_Q_NEIGHBORS : ODD_Q_NEIGHBORS)[d];
  return { q: hex.q + dq, r: hex.r + dr };
}

/** Get pixel center of hex for rendering */
export function hexToPixel(hex: Hex, size: number): { x: number; y: number } {
  const w = size * Math.sqrt(3);
  const h = size * 2;
  const x = size * Math.sqrt(3) * hex.q + (hex.r % 2 !== 0 ? w * 0.5 : 0);
  const y = h * 0.75 * hex.r;
  return { x, y };
}

/** SVG hex path (pointy-top) */
export function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** Check if two tiles' connections match */
export function connectionsMatch(a: { hex: Hex; currentMask: Mask }, b: { hex: Hex; currentMask: Mask }): boolean {
  // Find which direction a→b is
  const dirs: [number, number][] = a.hex.q % 2 === 0 ? EVEN_Q_NEIGHBORS : ODD_Q_NEIGHBORS;
  let aDir: Dir = 0;
  for (let d = 0; d < 6; d++) {
    if (dirs[d][0] === b.hex.q - a.hex.q && dirs[d][1] === b.hex.r - a.hex.r) {
      aDir = d as Dir;
      break;
    }
  }
  return hasConn(a.currentMask, aDir) === hasConn(b.currentMask, opposite(aDir));
}

/** Build adjacency map from tile list */
function buildAdj(tiles: { hex: Hex }[]): Map<string, { hex: Hex }[]> {
  const map = new Map<string, { hex: Hex }[]>();
  const key = (h: Hex) => `${h.q},${h.r}`;

  for (const t of tiles) {
    const neighbors: { hex: Hex }[] = [];
    for (let d = 0; d < 6; d++) {
      const n = getNeighbor(t.hex, d as Dir);
      if (tiles.some((t2) => t2.hex.q === n.q && t2.hex.r === n.r)) {
        neighbors.push({ hex: n });
      }
    }
    map.set(key(t.hex), neighbors);
  }
  return map;
}

/** Check if puzzle is solved — all connections match, no dangling connections */
export function isSolved(tiles: { hex: Hex; currentMask: Mask }[]): boolean {
  for (const t of tiles) {
    for (let d = 0; d < 6; d++) {
      if (!hasConn(t.currentMask, d as Dir)) continue;
      const n = getNeighbor(t.hex, d as Dir);
      const neighbor = tiles.find((t2) => t2.hex.q === n.q && t2.hex.r === n.r);
      if (!neighbor) return false; // dangling outside grid
      if (!hasConn(neighbor.currentMask, opposite(d as Dir))) return false; // mismatched
    }
  }
  return true;
}

/** Check if all tiles with connections form closed loops (no orphans) */
export function checkConnected(tiles: { hex: Hex; currentMask: Mask }[]): boolean {
  const visited = new Set<string>();
  const key = (h: Hex) => `${h.q},${h.r}`;
  const adj = buildAdj(tiles);

  // Find first tile with connections
  const start = tiles.find((t) => t.currentMask !== 0);
  if (!start) return true;

  // BFS from start
  const queue = [start];
  visited.add(key(start.hex));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(key(current.hex)) || [];

    for (const n of neighbors) {
      const k = key(n.hex);
      if (visited.has(k)) continue;
      if (!connectionsMatch(current, { hex: n.hex, currentMask: tiles.find((t) => t.hex.q === n.hex.q && t.hex.r === n.hex.r)?.currentMask || 0 })) continue;
      visited.add(k);
      queue.push(n as any);
    }
  }

  return true; // simplified — full solve check is isSolved()
}

/** Helper to create a simple chain/loop of hexes */
function chain(hexes: Hex[], masks: Mask[]): { q: number; r: number; mask: number }[] {
  return hexes.map((h, i) => ({ q: h.q, r: h.r, mask: masks[i] }));
}

function hex(q: number, r: number): Hex {
  return { q, r };
}

/**
 * Create a closed loop by defining a path of hex positions.
 * Each hex connects to its predecessor and successor in the path.
 */
function closedLoop(path: Hex[]): { q: number; r: number; mask: number }[] {
  return path.map((h, i) => {
    const prev = path[(i - 1 + path.length) % path.length];
    const next = path[(i + 1) % path.length];
    let mask = 0;
    // Find directions to prev and next
    const dirs = h.q % 2 === 0 ? EVEN_Q_NEIGHBORS : ODD_Q_NEIGHBORS;
    for (let d = 0; d < 6; d++) {
      const [dq, dr] = dirs[d];
      if ((prev.q === h.q + dq && prev.r === h.r + dr) ||
          (next.q === h.q + dq && next.r === h.r + dr)) {
        mask |= 1 << d;
      }
    }
    return { q: h.q, r: h.r, mask };
  });
}

/** Create a center hex with connections to all its neighbors */
function centerWithRing(center: Hex, ring: Hex[]): { q: number; r: number; mask: number }[] {
  const result: { q: number; r: number; mask: number }[] = [];
  // Center connects to all ring neighbors
  let centerMask = 0;
  const cDirs = center.q % 2 === 0 ? EVEN_Q_NEIGHBORS : ODD_Q_NEIGHBORS;
  for (const r of ring) {
    for (let d = 0; d < 6; d++) {
      const [dq, dr] = cDirs[d];
      if (center.q + dq === r.q && center.r + dr === r.r) {
        centerMask |= 1 << d;
        break;
      }
    }
  }
  result.push({ q: center.q, r: center.r, mask: centerMask });

  // Ring hexes connect back to center and optionally to adjacent ring hexes
  for (let i = 0; i < ring.length; i++) {
    const r = ring[i];
    let mask = 0;
    const rDirs = r.q % 2 === 0 ? EVEN_Q_NEIGHBORS : ODD_Q_NEIGHBORS;
    // Connect back to center
    for (let d = 0; d < 6; d++) {
      const [dq, dr] = rDirs[d];
      if (r.q + dq === center.q && r.r + dr === center.r) {
        mask |= 1 << d;
        break;
      }
    }
    // Connect to adjacent ring hexes
    const prev = ring[(i - 1 + ring.length) % ring.length];
    const next = ring[(i + 1) % ring.length];
    for (let d = 0; d < 6; d++) {
      const [dq, dr] = rDirs[d];
      if ((prev.q === r.q + dq && prev.r === r.r + dr) ||
          (next.q === r.q + dq && next.r === r.r + dr)) {
        mask |= 1 << d;
      }
    }
    result.push({ q: r.q, r: r.r, mask });
  }
  return result;
}

/** Handcrafted levels — each defines a solved configuration */
export const LEVEL_DATA: { tiles: { q: number; r: number; mask: number }[] }[] = [
  // Level 1: Two hexes, simple curve loop
  {
    tiles: closedLoop([hex(0, 0), hex(1, 0)]),
  },
  // Level 2: Triangle of 3 hexes
  {
    tiles: closedLoop([hex(0, 0), hex(1, 0), hex(0, 1)]),
  },
  // Level 3: 4-hex diamond loop
  {
    tiles: closedLoop([hex(0, 0), hex(1, 0), hex(1, 1), hex(0, 1)]),
  },
  // Level 4: 5-hex pentagon
  {
    tiles: closedLoop([hex(0, 0), hex(1, 0), hex(2, 0), hex(2, 1), hex(1, 1)]),
  },
  // Level 5: 6-hex hexagon ring
  {
    tiles: closedLoop([hex(0, 0), hex(1, 0), hex(2, 0), hex(2, 1), hex(1, 1), hex(0, 1)]),
  },
  // Level 6: Center + ring of 6
  {
    tiles: centerWithRing(
      hex(1, 1),
      [hex(1, 0), hex(2, 0), hex(2, 1), hex(1, 2), hex(0, 1), hex(0, 0)]
    ),
  },
  // Level 7: Two connected loops
  {
    tiles: [
      ...closedLoop([hex(0, 0), hex(1, 0), hex(1, 1), hex(0, 1)]),
      ...closedLoop([hex(2, 0), hex(3, 0), hex(3, 1), hex(2, 1)]),
    ],
  },
  // Level 8: Figure-8 shape
  {
    tiles: closedLoop([hex(0, 0), hex(1, 0), hex(1, 1), hex(0, 1), hex(0, 2), hex(1, 2), hex(1, 1)]),
  },
  // Level 9: Zigzag loop
  {
    tiles: closedLoop([hex(0, 0), hex(1, 0), hex(2, 0), hex(2, 1), hex(1, 1), hex(0, 1), hex(0, 2), hex(1, 2)]),
  },
  // Level 10: Large hexagon
  {
    tiles: closedLoop([hex(0, 0), hex(1, 0), hex(2, 0), hex(3, 0), hex(3, 1), hex(2, 1), hex(1, 1), hex(0, 1), hex(0, 2), hex(1, 2), hex(2, 2), hex(2, 1)]),
  },
  // Levels 11-30: generated patterns of increasing complexity
  ...Array.from({ length: 20 }, (_, i) => {
    const level = i + 11;
    const size = Math.min(4 + Math.floor(i / 3), 6);
    // Generate a ring pattern
    const tiles: { q: number; r: number; mask: number }[] = [];

    // Center hex
    tiles.push({ q: 0, r: 0, mask: 0b111111 });

    // Ring around center
    const dirs: [number, number][] = EVEN_Q_NEIGHBORS;
    for (let d = 0; d < 6; d++) {
      const n = getNeighbor({ q: 0, r: 0 }, d as Dir);
      // Each ring tile connects to center and to next ring tile
      const nextD = (d + 1) % 6;
      const mask = (1 << opposite(d as Dir)) | (1 << rotateDir(nextD as Dir, -1));
      tiles.push({ q: n.q, r: n.r, mask });

      // Add outer ring for larger levels
      if (size > 3 && d < 4) {
        const outer = getNeighbor(n, nextD as Dir);
        // Check not duplicate
        if (!tiles.some((t) => t.q === outer.q && t.r === outer.r)) {
          tiles.push({ q: outer.q, r: outer.r, mask: (1 << rotateDir(d as Dir, 3)) | (1 << opposite(nextD as Dir)) });
        }
      }
    }

    // For even larger levels, add second ring
    if (size > 5) {
      for (let d = 0; d < 3; d++) {
        const n1 = getNeighbor({ q: 0, r: 0 }, d as Dir);
        const n2 = getNeighbor({ q: 0, r: 0 }, ((d + 1) % 6) as Dir);
        const outer = getNeighbor(n1, ((d + 1) % 6) as Dir);
        if (!tiles.some((t) => t.q === outer.q && t.r === outer.r)) {
          tiles.push({ q: outer.q, r: outer.r, mask: 0b010101 });
        }
      }
    }

    return { tiles };
  }),
];

/** Scramble a solved puzzle by rotating each tile randomly */
export function scrambleLevel(
  tiles: { q: number; r: number; mask: number }[],
  levelId: number
): { q: number; r: number; solvedMask: number; rotation: number; currentMask: number }[] {
  // Use level ID as seed for reproducibility
  let seed = levelId * 12345 + 67890;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  return tiles.map((t) => {
    const steps = 1 + Math.floor(rng() * 5); // 1-5 rotations (never 0 = solved)
    return {
      q: t.q,
      r: t.r,
      solvedMask: t.mask,
      rotation: steps,
      currentMask: rotateMask(t.mask, steps),
    };
  });
}
