import { TILE } from '../config/constants';
import { MAP, LEVEL_COLS } from '../data/level1';
import { Tile } from '../types';

// Check if a tile type is solid (blocks player movement)
export function isSolidTile(type: number): boolean {
  return type >= 1 && type <= 8;
}

// Get all solid tiles that overlap with a rectangle
export function getSolidTilesInRect(rect: { x: number; y: number; width: number; height: number }): Tile[] {
  const tiles: Tile[] = [];
  
  const startCol = Math.max(0, Math.floor(rect.x / TILE));
  const endCol = Math.min(LEVEL_COLS - 1, Math.floor((rect.x + rect.width) / TILE));
  const startRow = Math.max(0, Math.floor(rect.y / TILE));
  const endRow = Math.min(MAP.length - 1, Math.floor((rect.y + rect.height) / TILE));
  
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const type = MAP[row][col];
      if (type === 0 || !isSolidTile(type)) continue;
      
      tiles.push({
        x: col * TILE,
        y: row * TILE,
        width: TILE,
        height: TILE,
        type,
        row,
        col,
      });
    }
  }
  
  return tiles;
}
