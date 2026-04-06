import { TILE } from '../config/constants';
import type { LevelDefinition } from './levels';

/**
 * Level 2 — "Desert Fortress"  (Mario 3-inspired)
 *
 * Tile legend (same as level 1):
 *   0 = empty
 *   1 = ground
 *   2 = brick (breakable)
 *   3 = item block (coin)
 *   4 = item block (powerup / mushroom)
 *   5 = solid block (non-breakable)
 *   6 = fire flower item block
 *   7 = pipe body
 *   8 = pipe top
 *
 * 100 columns × 12 rows overworld.
 * Two underground zones: coin_vault (20×12) and pipe_maze (30×12).
 */

// prettier-ignore
const MAP: number[][] = [
// 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 2, 3, 4, 2, 0, 0, 0, 0, 0, 7, 7, 0, 0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 2, 6, 2, 7, 7, 0, 0, 0, 0, 0, 3, 0, 0, 5, 5, 0, 0, 2, 3, 2, 3, 0, 0, 0, 0, 7, 7, 0, 0, 0, 2, 4, 2, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 2, 6, 2, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const ENEMIES = [
  { type: 'goomba' as const, x: 8 * TILE, y: 10 * TILE - 44 },
  { type: 'goomba' as const, x: 12 * TILE, y: 10 * TILE - 44 },
  { type: 'turtle' as const, x: 22 * TILE, y: 10 * TILE - 52 },
  { type: 'flyer' as const, x: 18 * TILE, y: 5 * TILE },
  { type: 'goomba' as const, x: 34 * TILE, y: 10 * TILE - 44 },
  { type: 'goomba' as const, x: 35 * TILE, y: 10 * TILE - 44 },
  { type: 'turtle' as const, x: 44 * TILE, y: 10 * TILE - 52 },
  { type: 'flyer' as const, x: 48 * TILE, y: 4 * TILE },
  { type: 'goomba' as const, x: 55 * TILE, y: 10 * TILE - 44 },
  { type: 'turtle' as const, x: 65 * TILE, y: 10 * TILE - 52 },
  { type: 'flyer' as const, x: 70 * TILE, y: 5 * TILE },
  { type: 'goomba' as const, x: 75 * TILE, y: 10 * TILE - 44 },
  { type: 'goomba' as const, x: 82 * TILE, y: 10 * TILE - 44 },
  { type: 'turtle' as const, x: 88 * TILE, y: 10 * TILE - 52 },
  { type: 'goomba' as const, x: 93 * TILE, y: 10 * TILE - 44 },
];

const COINS = [
  { x: 6 * TILE + 4,  y: 8 * TILE },
  { x: 7 * TILE + 4,  y: 8 * TILE },
  { x: 23 * TILE + 4, y: 3 * TILE },
  { x: 24 * TILE + 4, y: 3 * TILE },
  { x: 25 * TILE + 4, y: 3 * TILE },
  { x: 37 * TILE + 4, y: 6 * TILE },
  { x: 41 * TILE + 4, y: 6 * TILE },
  { x: 58 * TILE + 4, y: 6 * TILE },
  { x: 68 * TILE + 4, y: 3 * TILE },
  { x: 69 * TILE + 4, y: 3 * TILE },
  { x: 85 * TILE + 4, y: 3 * TILE },
  { x: 86 * TILE + 4, y: 3 * TILE },
];

const FLAG_POS = { x: 96.08 * TILE - 10, y: 4 * TILE };
const PLAYER_START = { x: 2 * TILE, y: 10 * TILE - 48 };

/* ──────────────────────────────────────────────────────
   Underground 1 — "Coin Vault"
   A small room packed with coins and a couple of enemies.
   20 columns × 12 rows
   ────────────────────────────────────────────────────── */

// prettier-ignore
const COIN_VAULT_MAP: number[][] = [
// 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [5, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 8, 8, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 7, 7, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 5],
  [5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5],
  [5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5],
];

const COIN_VAULT_ENEMIES = [
  { type: 'goomba' as const, x: 8 * TILE, y: 9 * TILE - 44 },
  { type: 'flyer' as const, x: 10 * TILE, y: 3 * TILE },
];

const COIN_VAULT_COINS = [
  { x: 4 * TILE + 4,  y: 9 * TILE },
  { x: 5 * TILE + 4,  y: 9 * TILE },
  { x: 6 * TILE + 4,  y: 9 * TILE },
  { x: 7 * TILE + 4,  y: 9 * TILE },
  { x: 8 * TILE + 4,  y: 9 * TILE },
  { x: 9 * TILE + 4,  y: 9 * TILE },
  { x: 10 * TILE + 4, y: 9 * TILE },
  { x: 11 * TILE + 4, y: 9 * TILE },
  { x: 5 * TILE + 4,  y: 4 * TILE },
  { x: 6 * TILE + 4,  y: 4 * TILE },
  { x: 7 * TILE + 4,  y: 4 * TILE },
  { x: 8 * TILE + 4,  y: 4 * TILE },
  { x: 9 * TILE + 4,  y: 4 * TILE },
  { x: 10 * TILE + 4, y: 4 * TILE },
  { x: 11 * TILE + 4, y: 4 * TILE },
  { x: 12 * TILE + 4, y: 4 * TILE },
];

/* ──────────────────────────────────────────────────────
   Underground 2 — "Pipe Maze"
   Wider underground with multiple platforms and tighter jumps.
   30 columns × 12 rows
   ────────────────────────────────────────────────────── */

// prettier-ignore
const PIPE_MAZE_MAP: number[][] = [
// 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [5, 0, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 6, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 7, 7, 0, 0, 5],
  [5, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 5, 5, 7, 7, 0, 0, 5],
  [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 0, 0, 5],
  [5, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5],
  [5, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5],
];

const PIPE_MAZE_ENEMIES = [
  { type: 'goomba' as const, x: 5 * TILE,  y: 9 * TILE - 44 },
  { type: 'turtle' as const, x: 12 * TILE, y: 9 * TILE - 52 },
  { type: 'flyer' as const,  x: 16 * TILE, y: 4 * TILE },
  { type: 'goomba' as const, x: 22 * TILE, y: 9 * TILE - 44 },
];

const PIPE_MAZE_COINS = [
  { x: 4 * TILE + 4,  y: 9 * TILE },
  { x: 5 * TILE + 4,  y: 9 * TILE },
  { x: 10 * TILE + 4, y: 9 * TILE },
  { x: 11 * TILE + 4, y: 9 * TILE },
  { x: 13 * TILE + 4, y: 9 * TILE },
  { x: 14 * TILE + 4, y: 9 * TILE },
  { x: 20 * TILE + 4, y: 9 * TILE },
  { x: 21 * TILE + 4, y: 9 * TILE },
  { x: 22 * TILE + 4, y: 3 * TILE },
  { x: 23 * TILE + 4, y: 3 * TILE },
];

/* ──────────────────────────────────────────────────────
   Warp pipes
   ────────────────────────────────────────────────────── */

const WARP_PIPES = [
  {
    // Overworld pipe 1 (col 14) → Coin Vault
    id: 'l2-ow-to-vault',
    entryZone: 'overworld',
    entryCol: 14,
    entryRow: 5,
    exitZone: 'coin_vault',
    exitCol: 2,
    exitRow: 2,
    exitPlayerX: 2 * TILE,
    exitPlayerY: 3 * TILE,
    emergeDirection: 'down' as const,
  },
  {
    // Coin Vault exit → overworld (col 30, exit pipe)
    id: 'l2-vault-to-ow',
    entryZone: 'coin_vault',
    entryCol: 15,
    entryRow: 5,
    exitZone: 'overworld',
    exitCol: 30,
    exitRow: 5,
    exitPlayerX: 30 * TILE,
    exitPlayerY: 5 * TILE - 48,
    emergeDirection: 'up' as const,
  },
  {
    // Overworld pipe 2 (col 52) → Pipe Maze
    id: 'l2-ow-to-maze',
    entryZone: 'overworld',
    entryCol: 52,
    entryRow: 5,
    exitZone: 'pipe_maze',
    exitCol: 2,
    exitRow: 2,
    exitPlayerX: 2 * TILE,
    exitPlayerY: 3 * TILE,
    emergeDirection: 'down' as const,
  },
  {
    // Pipe Maze exit → overworld (col 78)
    id: 'l2-maze-to-ow',
    entryZone: 'pipe_maze',
    entryCol: 25,
    entryRow: 5,
    exitZone: 'overworld',
    exitCol: 78,
    exitRow: 6,
    exitPlayerX: 78 * TILE,
    exitPlayerY: 6 * TILE - 48,
    emergeDirection: 'up' as const,
  },
  {
    // Overworld pipe 3 (col 90) → Pipe Maze (exits at col 78, nearby)
    id: 'l2-ow-to-maze2',
    entryZone: 'overworld',
    entryCol: 90,
    entryRow: 5,
    exitZone: 'pipe_maze',
    exitCol: 2,
    exitRow: 2,
    exitPlayerX: 2 * TILE,
    exitPlayerY: 3 * TILE,
    emergeDirection: 'down' as const,
  },
];

/* ──────────────────────────────────────────────────────
   LevelDefinition export
   ────────────────────────────────────────────────────── */

export const LEVEL2: LevelDefinition = {
  id: '1-2',
  displayName: 'World 1-2',
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
    coin_vault: {
      id: 'coin_vault',
      kind: 'underground',
      map: COIN_VAULT_MAP,
      enemies: COIN_VAULT_ENEMIES,
      coins: COIN_VAULT_COINS,
    },
    pipe_maze: {
      id: 'pipe_maze',
      kind: 'underground',
      map: PIPE_MAZE_MAP,
      enemies: PIPE_MAZE_ENEMIES,
      coins: PIPE_MAZE_COINS,
    },
  },
  warpPipes: WARP_PIPES,
};
