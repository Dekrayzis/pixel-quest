import { GRAVITY, MAX_FALL_SPEED, TILE } from '../config/constants';
import {
  MAP, LEVEL_COLS, LEVEL_ROWS,
  UNDERGROUND_MAP, UNDERGROUND_COLS, UNDERGROUND_ROWS,
} from '../data/level1';

export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  col: number;
  type: number;
}

/** Map data lookup by zone name */
function getZoneData(zone: string): { map: number[][]; cols: number; rows: number } {
  if (zone === 'underground') {
    return { map: UNDERGROUND_MAP, cols: UNDERGROUND_COLS, rows: UNDERGROUND_ROWS };
  }
  return { map: MAP, cols: LEVEL_COLS, rows: LEVEL_ROWS };
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
export function getTileAt(px: number, py: number, zone = 'overworld'): number {
  const { map, cols, rows } = getZoneData(zone);
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);
  if (col < 0 || col >= cols || row < 0 || row >= rows) return 0;
  return map[row][col];
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
export function getSolidTilesInRect(rect: { x: number; y: number; width: number; height: number }, zone = 'overworld'): TileRect[] {
  const { map, cols, rows } = getZoneData(zone);
  const tiles: TileRect[] = [];
  const startCol = Math.max(0, Math.floor(rect.x / TILE));
  const endCol = Math.min(cols - 1, Math.floor((rect.x + rect.width - 1) / TILE));
  const startRow = Math.max(0, Math.floor(rect.y / TILE));
  const endRow = Math.min(rows - 1, Math.floor((rect.y + rect.height - 1) / TILE));

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const type = map[row][col];
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
