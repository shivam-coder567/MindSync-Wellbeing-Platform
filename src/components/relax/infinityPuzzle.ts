/**
 * Infinity Flow — Puzzle Engine
 *
 * Generates a guaranteed-solvable connected network on a grid.
 * The solved state is a fully connected system with no dangling edges.
 */

// Connection directions: top, right, bottom, left
const DIRS = [
  [0, -1], // top
  [1, 0],  // right
  [0, 1],  // bottom
  [-1, 0], // left
] as const;

type Dir = 0 | 1 | 2 | 3; // top, right, bottom, left

export interface Tile {
  /** Connections as bitflags: top=1, right=2, bottom=4, left=8 */
  connections: number;
  solvedConnections: number;
  /** Current rotation in degrees (0, 90, 180, 270) */
  rotation: number;
  /** Row position */
  row: number;
  /** Column position */
  col: number;
}

export interface Puzzle {
  size: number;
  tiles: Tile[][];
  solvedTiles: number[][]; // connection bitflags in solved state
}

export type Difficulty = "quiet" | "flow" | "deep" | "immersive";

export const DIFFICULTY_CONFIG: Record<Difficulty, { size: number; label: string; description: string }> = {
  quiet: { size: 4, label: "Quiet", description: "4 × 4 — gentle beginning" },
  flow: { size: 5, label: "Flow", description: "5 × 5 — steady rhythm" },
  deep: { size: 6, label: "Deep Flow", description: "6 × 6 — deeper pattern" },
  immersive: { size: 7, label: "Immersive", description: "7 × 7 — full immersion" },
};

const DIFFICULTY_ORDER: Difficulty[] = ["quiet", "flow", "deep", "immersive"];

export function getNextDifficulty(current: Difficulty): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(current);
  return DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length];
}

/** Bitflag helpers */
export function hasConnection(connections: number, dir: Dir): boolean {
  return (connections & (1 << dir)) !== 0;
}

export function addConnection(connections: number, dir: Dir): number {
  return connections | (1 << dir);
}

function opposite(dir: Dir): Dir {
  return ((dir + 2) % 4) as Dir;
}

/** Check if a tile position is within the grid */
function inBounds(row: number, col: number, size: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

/**
 * Generate a fully connected solved puzzle using randomized DFS.
 * This guarantees every cell is reachable and all edges connect.
 */
function generateSolvedGrid(size: number): number[][] {
  const grid: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0)
  );
  const visited: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Shuffle directions for randomness
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Randomized DFS from (0,0)
  function dfs(row: number, col: number) {
    visited[row][col] = true;
    const dirs = shuffle([0, 1, 2, 3] as Dir[]);

    for (const d of dirs) {
      const [dc, dr] = DIRS[d];
      const nr = row + dr;
      const nc = col + dc;

      if (inBounds(nr, nc, size) && !visited[nr][nc]) {
        // Connect current tile in direction d
        grid[row][col] = addConnection(grid[row][col], d);
        // Connect neighbor in opposite direction
        grid[nr][nc] = addConnection(grid[nr][nc], opposite(d));
        dfs(nr, nc);
      }
    }
  }

  dfs(0, 0);

  // Add some extra random connections for visual richness
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const extraDirs = shuffle([0, 1, 2, 3] as Dir[]).slice(
        0,
        Math.floor(Math.random() * 2)
      );
      for (const d of extraDirs) {
        const [dc, dr] = DIRS[d];
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc, size)) {
          grid[r][c] = addConnection(grid[r][c], d);
          grid[nr][nc] = addConnection(grid[nr][nc], opposite(d));
        }
      }
    }
  }

  return grid;
}

/** Count active connections in a bitflag */
function connectionCount(c: number): number {
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (c & (1 << i)) count++;
  }
  return count;
}

/**
 * Rotate a connection bitflag by the given number of 90° clockwise steps.
 */
export function rotateConnections(connections: number, steps: number): number {
  let result = connections;
  for (let i = 0; i < (steps % 4); i++) {
    // Rotate: top→right→bottom→left→top
    result = ((result << 1) | (result >> 3)) & 0xf;
  }
  return result;
}

/**
 * Generate a puzzle with guaranteed solution.
 * Returns the solved grid and a scrambled version.
 */
export function generatePuzzle(size: number): Puzzle {
  const solvedGrid = generateSolvedGrid(size);

  // Create tiles
  const tiles: Tile[][] = [];

  for (let r = 0; r < size; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < size; c++) {
      const solved = solvedGrid[r][c];
      // Random rotation (1–3 steps, never 0 since that would be solved)
      const steps = 1 + Math.floor(Math.random() * 3);
      const scrambled = rotateConnections(solved, steps);
      const rotation = (steps * 90) % 360;

      row.push({
        connections: scrambled,
        solvedConnections: solved,
        rotation,
        row: r,
        col: c,
      });
    }
    tiles.push(row);
  }

  // Ensure not already solved
  if (isSolved({ size, tiles, solvedTiles: solvedGrid })) {
    // Rotate one tile
    tiles[0][0].connections = rotateConnections(tiles[0][0].connections, 1);
    tiles[0][0].rotation = (tiles[0][0].rotation + 90) % 360;
  }

  return { size, tiles, solvedTiles: solvedGrid };
}

/**
 * Rotate a specific tile clockwise.
 */
export function rotateTile(puzzle: Puzzle, row: number, col: number): Puzzle {
  const newTiles = puzzle.tiles.map((r) => r.map((t) => ({ ...t })));
  const tile = newTiles[row][col];
  tile.connections = rotateConnections(tile.connections, 1);
  tile.rotation = (tile.rotation + 90) % 360;

  return { ...puzzle, tiles: newTiles };
}

/**
 * Check if all adjacent connections match and the network is connected.
 */
export function isSolved(puzzle: Puzzle): boolean {
  const { size, tiles } = puzzle;

  // Check all edges match between adjacent tiles
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const tile = tiles[r][c];

      // Check top neighbor
      if (r > 0) {
        const topConnected = hasConnection(tile.connections, 0);
        const bottomOfAbove = hasConnection(tiles[r - 1][c].connections, 2);
        if (topConnected !== bottomOfAbove) return false;
      }
      // Top edge should not connect outside grid
      if (r === 0 && hasConnection(tile.connections, 0)) return false;

      // Check right neighbor
      if (c < size - 1) {
        const rightConnected = hasConnection(tile.connections, 1);
        const leftOfRight = hasConnection(tiles[r][c + 1].connections, 3);
        if (rightConnected !== leftOfRight) return false;
      }
      // Right edge
      if (c === size - 1 && hasConnection(tile.connections, 1)) return false;

      // Check bottom neighbor
      if (r < size - 1) {
        const bottomConnected = hasConnection(tile.connections, 2);
        const topOfBelow = hasConnection(tiles[r + 1][c].connections, 0);
        if (bottomConnected !== topOfBelow) return false;
      }
      // Bottom edge
      if (r === size - 1 && hasConnection(tile.connections, 2)) return false;

      // Check left neighbor
      if (c > 0) {
        const leftConnected = hasConnection(tile.connections, 3);
        const rightOfLeft = hasConnection(tiles[r][c - 1].connections, 1);
        if (leftConnected !== rightOfLeft) return false;
      }
      // Left edge
      if (c === 0 && hasConnection(tile.connections, 3)) return false;
    }
  }

  // Check connectivity via BFS — all tiles with any connection must be reachable
  return checkConnectivity(puzzle);
}

/**
 * BFS connectivity check: all connected tiles form one network.
 */
function checkConnectivity(puzzle: Puzzle): boolean {
  const { size, tiles } = puzzle;

  // Find first tile with connections
  let startR = -1,
    startC = -1;
  for (let r = 0; r < size && startR === -1; r++) {
    for (let c = 0; c < size && startR === -1; c++) {
      if (tiles[r][c].connections !== 0) {
        startR = r;
        startC = c;
      }
    }
  }

  if (startR === -1) return true; // No connections — vacuously connected

  const visited: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const queue: [number, number][] = [[startR, startC]];
  visited[startR][startC] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const tile = tiles[r][c];

    for (let d = 0; d < 4; d++) {
      if (!hasConnection(tile.connections, d as Dir)) continue;

      const [dc, dr] = DIRS[d];
      const nr = r + dr;
      const nc = c + dc;

      if (inBounds(nr, nc, size) && !visited[nr][nc]) {
        // Verify neighbor also connects back
        if (hasConnection(tiles[nr][nc].connections, opposite(d as Dir))) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
  }

  // Every tile with connections must be visited
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (tiles[r][c].connections !== 0 && !visited[r][c]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Find one incorrect tile for the hint system.
 * Returns the tile whose current connections differ from solved,
 * or null if already solved.
 */
export function findHintTile(puzzle: Puzzle): { row: number; col: number } | null {
  const { size, tiles } = puzzle;

  // Find tiles that don't match their solved state
  const incorrect: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (tiles[r][c].connections !== tiles[r][c].solvedConnections) {
        incorrect.push({ row: r, col: c });
      }
    }
  }

  if (incorrect.length === 0) return null;

  // Return a random incorrect tile
  return incorrect[Math.floor(Math.random() * incorrect.length)];
}

/**
 * Get the SVG path data for a tile's connections.
 * All connections are relative to the tile center.
 */
export function getTilePathData(connections: number): string[] {
  const paths: string[] = [];
  const cx = 50;
  const cy = 50;
  const len = 38;

  if (hasConnection(connections, 0)) {
    // Top
    paths.push(`M ${cx} ${cy} L ${cx} ${cy - len}`);
  }
  if (hasConnection(connections, 1)) {
    // Right
    paths.push(`M ${cx} ${cy} L ${cx + len} ${cy}`);
  }
  if (hasConnection(connections, 2)) {
    // Bottom
    paths.push(`M ${cx} ${cy} L ${cx} ${cy + len}`);
  }
  if (hasConnection(connections, 3)) {
    // Left
    paths.push(`M ${cx} ${cy} L ${cx - len} ${cy}`);
  }

  return paths;
}

/**
 * Check if a specific direction has a connection that goes outside the board.
 */
export function hasExternalConnection(
  puzzle: Puzzle,
  row: number,
  col: number
): number[] {
  const { size, tiles } = puzzle;
  const tile = tiles[row][col];
  const externals: number[] = [];

  if (row === 0 && hasConnection(tile.connections, 0)) externals.push(0);
  if (col === size - 1 && hasConnection(tile.connections, 1)) externals.push(1);
  if (row === size - 1 && hasConnection(tile.connections, 2)) externals.push(2);
  if (col === 0 && hasConnection(tile.connections, 3)) externals.push(3);

  return externals;
}
