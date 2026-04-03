import { GRAVITY, MAX_FALL_SPEED, TILE } from '../config/constants';
import { MAP, LEVEL_COLS, LEVEL_ROWS } from '../data/level1';

interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
  type: number;
}

/**
 * Apply gravity to a velocity-Y value, clamped to MAX_FALL_SPEED.
 */
export function applyGravity(vy: number): number {
  return Math.min(vy + GRAVITY, MAX_FALL_SPEED);
}

/**
 * Get the tile type at a given pixel position.
 * Returns 0 (empty) for out-of-bounds.
 */
export function getTileAt(px: number, py: number): number {
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);
  if (col < 0 || col >= LEVEL_COLS || row < 0 || row >= LEVEL_ROWS) return 0;
  return MAP[row][col];
}

/**
 * Check if a tile type is solid (blocks movement).
 * Types: 1=ground, 2=brick, 3=item(coin), 4=item(powerup), 5=solid, 6=fire, 7=pipe, 8=pipe top
 */
export function isSolidTile(type: number): boolean {
  return type >= 1 && type <= 8;
}

/**
 * Get all solid tile rects that overlap a given AABB (entity bounding box).
 * Used for broad-phase tile collision.
 */
export function getSolidTilesInRect(rect: { x: number; y: number; width: number; height: number }): TileRect[] {
  const tiles: TileRect[] = [];
  const startCol = Math.max(0, Math.floor(rect.x / TILE));
  const endCol = Math.min(LEVEL_COLS - 1, Math.floor((rect.x + rect.width - 1) / TILE));
  const startRow = Math.max(0, Math.floor(rect.y / TILE));
  const endRow = Math.min(LEVEL_ROWS - 1, Math.floor((rect.y + rect.height - 1) / TILE));

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const type = MAP[row][col];
      if (isSolidTile(type)) {
        tiles.push({
          x: col * TILE,
          y: row * TILE,
          width: TILE,
          height: TILE,
          row,
          col,
          type,
        });
      }
    }
  }
  return tiles;
}
