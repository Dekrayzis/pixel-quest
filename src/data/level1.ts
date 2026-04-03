import { TILE } from '../config/constants';
import type { LevelDefinition } from './levels';

/**
 * Level 1 — "Emerald Plains"
 *
 * Tile legend (used in the map grid):
 *   0 = empty
 *   1 = ground
 *   2 = brick (breakable)
 *   3 = item block (coin)
 *   4 = item block (powerup / mushroom)
 *   5 = solid block (non-breakable platform)
 *   6 = fire flower item block
 *   7 = pipe body
 *   8 = pipe top
 *
 * The map is 80 columns × 12 rows (3840 × 576 px).
 * Row 0 is the top; row 11 is the bottom.
 */

// prettier-ignore
export const MAP: number[][] = [
// 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 2, 4, 2, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 8, 8, 0, 2, 6, 2, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 5, 5, 5, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 2, 6, 2, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 5, 5, 5, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const LEVEL_COLS = MAP[0].length;
export const LEVEL_ROWS = MAP.length;
export const LEVEL_W = LEVEL_COLS * TILE;
export const LEVEL_H = LEVEL_ROWS * TILE;

// Entity spawn definitions for level 1.
// Positions in pixels (can use col * TILE for alignment).
export const PLAYER_START = { x: 2 * TILE, y: 10 * TILE - 48 };

export const ENEMIES: { type: 'goomba' | 'flyer' | 'turtle'; x: number; y: number }[] = [
  { type: 'goomba', x: 10 * TILE, y: 10 * TILE - 44 },
  { type: 'goomba', x: 22 * TILE, y: 10 * TILE - 44 },
  { type: 'flyer',  x: 15 * TILE, y: 5 * TILE },
  { type: 'turtle', x: 24 * TILE, y: 10 * TILE - 52 },
  { type: 'goomba', x: 34 * TILE, y: 10 * TILE - 44 },
  { type: 'turtle', x: 40 * TILE, y: 10 * TILE - 52 },
  { type: 'goomba', x: 42 * TILE, y: 10 * TILE - 44 },
  { type: 'flyer',  x: 38 * TILE, y: 4 * TILE },
  { type: 'goomba', x: 50 * TILE, y: 10 * TILE - 44 },
  { type: 'flyer',  x: 55 * TILE, y: 5 * TILE },
  { type: 'turtle', x: 60 * TILE, y: 10 * TILE - 52 },
  { type: 'goomba', x: 62 * TILE, y: 10 * TILE - 44 },
  { type: 'goomba', x: 68 * TILE, y: 10 * TILE - 44 },
];

export const COINS = [
  { x: 5 * TILE + 4,  y: 8 * TILE },
  { x: 6 * TILE + 4,  y: 8 * TILE },
  { x: 13 * TILE + 4, y: 8 * TILE },
  { x: 24 * TILE + 4, y: 4 * TILE },
  { x: 25 * TILE + 4, y: 4 * TILE },
  { x: 26 * TILE + 4, y: 4 * TILE },
  { x: 36 * TILE + 4, y: 8 * TILE },
  { x: 37 * TILE + 4, y: 8 * TILE },
  { x: 48 * TILE + 4, y: 6 * TILE },
  { x: 49 * TILE + 4, y: 6 * TILE },
  { x: 57 * TILE + 4, y: 4 * TILE },
  { x: 58 * TILE + 4, y: 4 * TILE },
  { x: 63 * TILE + 4, y: 8 * TILE },
  { x: 64 * TILE + 4, y: 8 * TILE },
];

// Flag pole position (the end-of-level goal)
export const FLAG_POS = { x: 76.08 * TILE - 10, y: 4 * TILE };

/* ──────────────────────────────────────────────────────
   Underground sub-area
   ────────────────────────────────────────────────────── */

/**
 * Underground zone — a small enclosed room the player warps into.
 * 20 columns × 12 rows. Pipe on the right side exits back to overworld.
 * Uses the same tile legend as the overworld map.
 */
// prettier-ignore
export const UNDERGROUND_MAP: number[][] = [
// 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], // ceiling
  [5, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5], // entry pipe body from ceiling
  [5, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5], // entry pipe top (bottom of pipe)
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 5], // exit pipe top
  [5, 0, 0, 2, 3, 2, 3, 2, 3, 2, 0, 0, 0, 0, 7, 7, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 7, 7, 0, 0, 0, 5], // step to reach pipe
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 5],
  [5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5], // floor
  [5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5],
];

export const UNDERGROUND_COLS = UNDERGROUND_MAP[0].length;
export const UNDERGROUND_ROWS = UNDERGROUND_MAP.length;
export const UNDERGROUND_W = UNDERGROUND_COLS * TILE;
export const UNDERGROUND_H = UNDERGROUND_ROWS * TILE;

// Enemies in the underground area
export const UNDERGROUND_ENEMIES = [
  { type: 'flyer' as const, x: 8 * TILE, y: 3 * TILE },
];

// Coins in the underground area
export const UNDERGROUND_COINS = [
  { x: 5 * TILE + 4, y: 9 * TILE },
  { x: 6 * TILE + 4, y: 9 * TILE },
  { x: 7 * TILE + 4, y: 9 * TILE },
  { x: 8 * TILE + 4, y: 9 * TILE },
  { x: 9 * TILE + 4, y: 9 * TILE },
  { x: 10 * TILE + 4, y: 9 * TILE },
];

/**
 * Warp pipe definitions.
 * Each warp links an entry pipe (in one zone) to an exit pipe (in another zone).
 *
 * - entryZone / exitZone: 'overworld' or 'underground'
 * - entryCol, entryRow: the LEFT column of the 2-wide pipe-top (tile type 8) that triggers the warp
 * - exitCol, exitRow: the LEFT column of the 2-wide pipe-top the player emerges from
 * - exitPlayerX, exitPlayerY: pixel position where the player appears after emerging
 */
export const WARP_PIPES = [
  {
    // Overworld pipe at col 14-15 → underground: drop from ceiling pipe at col 2-3
    id: 'warp-ow-to-ug',
    entryZone: 'overworld',
    entryCol: 14,
    entryRow: 8,
    exitZone: 'underground',
    exitCol: 2,
    exitRow: 2,
    exitPlayerX: 2 * TILE,
    exitPlayerY: 3 * TILE,
    emergeDirection: 'down' as const,
  },
  {
    // Underground exit pipe at col 14-15, row 5 → overworld emerge at 2nd pipe (col 28-29, row 7)
    id: 'warp-ug-to-ow',
    entryZone: 'underground',
    entryCol: 14,
    entryRow: 5,
    exitZone: 'overworld',
    exitCol: 28,
    exitRow: 7,
    exitPlayerX: 28 * TILE,
    exitPlayerY: 7 * TILE - 48,
    emergeDirection: 'up' as const,
  },
];

/** Wrapped LevelDefinition for the new multi-level system */
export const LEVEL1: LevelDefinition = {
  id: '1-1',
  displayName: 'World 1-1',
  playerStart: PLAYER_START,
  flagPos: FLAG_POS,
  zones: {
    overworld: {
      id: 'overworld',
      kind: 'overworld',
      map: MAP,
      enemies: ENEMIES,
      coins: COINS,
    },
    underground: {
      id: 'underground',
      kind: 'underground',
      map: UNDERGROUND_MAP,
      enemies: UNDERGROUND_ENEMIES,
      coins: UNDERGROUND_COINS,
    },
  },
  warpPipes: WARP_PIPES,
};
