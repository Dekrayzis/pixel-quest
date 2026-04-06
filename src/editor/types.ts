/** Editor-internal types mirroring the game's LevelDefinition but mutable */

export type ZoneKind = 'overworld' | 'underground';
export type EnemyType = 'goomba' | 'flyer' | 'turtle';
export type EmergeDirection = 'up' | 'down';

export interface EditorEnemy {
  id: string;
  type: EnemyType;
  col: number;
  row: number;
}

export interface EditorCoin {
  id: string;
  col: number;
  row: number;
}

export interface EditorZone {
  id: string;
  kind: ZoneKind;
  cols: number;
  rows: number;
  map: number[][];
  enemies: EditorEnemy[];
  coins: EditorCoin[];
}

export interface EditorWarpPipe {
  id: string;
  entryZone: string;
  entryCol: number;
  entryRow: number;
  exitZone: string;
  exitCol: number;
  exitRow: number;
  exitPlayerCol: number;
  exitPlayerRow: number;
  emergeDirection: EmergeDirection;
}

export interface EditorLevel {
  id: string;
  displayName: string;
  playerStartCol: number;
  playerStartRow: number;
  flagCol: number;
  flagRow: number;
  zones: Record<string, EditorZone>;
  warpPipes: EditorWarpPipe[];
}

export type Tool =
  | 'tile'
  | 'enemy'
  | 'coin'
  | 'playerStart'
  | 'flag'
  | 'eraser'
  | 'warpEntry'
  | 'warpExit';

export const TILE_TYPES: { value: number; label: string; color: string }[] = [
  { value: 0, label: 'Empty', color: '#87CEEB' },
  { value: 1, label: 'Ground', color: '#8B4513' },
  { value: 2, label: 'Brick', color: '#CD853F' },
  { value: 3, label: 'Item (Coin)', color: '#FFD700' },
  { value: 4, label: 'Item (Powerup)', color: '#FF8C00' },
  { value: 5, label: 'Solid Block', color: '#696969' },
  { value: 6, label: 'Fire Flower Block', color: '#FF4500' },
  { value: 7, label: 'Pipe Body', color: '#228B22' },
  { value: 8, label: 'Pipe Top', color: '#32CD32' },
  { value: 9, label: 'Jump Pad', color: '#FF3030' },
];

export const ENEMY_TYPES: { value: EnemyType; label: string; color: string }[] = [
  { value: 'goomba', label: 'Goomba', color: '#A0522D' },
  { value: 'flyer', label: 'Flyer', color: '#9370DB' },
  { value: 'turtle', label: 'Turtle', color: '#2E8B57' },
];

export function createEmptyZone(id: string, kind: ZoneKind, cols: number, rows: number): EditorZone {
  const map: number[][] = [];
  for (let r = 0; r < rows; r++) {
    map.push(new Array(cols).fill(0));
  }
  return { id, kind, cols, rows, map, enemies: [], coins: [] };
}

export function createDefaultLevel(): EditorLevel {
  const zone = createEmptyZone('overworld', 'overworld', 80, 12);
  // Add ground on bottom two rows
  for (let c = 0; c < 80; c++) {
    zone.map[10][c] = 1;
    zone.map[11][c] = 1;
  }
  return {
    id: '1-1',
    displayName: 'New Level',
    playerStartCol: 2,
    playerStartRow: 9,
    flagCol: 76,
    flagRow: 4,
    zones: { overworld: zone },
    warpPipes: [],
  };
}

let _nextId = 1;
export function uid(): string {
  return `e${_nextId++}_${Date.now().toString(36)}`;
}
