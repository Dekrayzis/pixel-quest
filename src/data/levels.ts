export type ZoneKind = 'overworld' | 'underground';

export interface EnemySpawn {
  type: 'goomba' | 'flyer' | 'turtle';
  x: number;
  y: number;
}

export interface CoinSpawn {
  x: number;
  y: number;
}

export interface ZoneDefinition {
  id: string;
  kind: ZoneKind;
  map: number[][];
  enemies: EnemySpawn[];
  coins: CoinSpawn[];
}

export interface WarpPipe {
  id: string;
  entryZone: string;
  entryCol: number;
  entryRow: number;
  exitZone: string;
  exitCol: number;
  exitRow: number;
  exitPlayerX: number;
  exitPlayerY: number;
  emergeDirection: 'up' | 'down';
}

export interface LevelDefinition {
  id: string;
  displayName: string;
  playerStart: { x: number; y: number };
  flagPos: { x: number; y: number };
  zones: Record<string, ZoneDefinition>;
  warpPipes: WarpPipe[];
}

import { LEVEL1 } from './level1';
import { LEVEL2 } from './level2';
import { LEVEL3 } from './level3';
import { LEVEL_1_4 } from './level4';

export const LEVEL_ORDER = [LEVEL1.id, LEVEL2.id, LEVEL3.id, LEVEL_1_4.id];

export const LEVELS: Record<string, LevelDefinition> = {
  [LEVEL1.id]: LEVEL1,
  [LEVEL2.id]: LEVEL2,
  [LEVEL3.id]: LEVEL3,
  [LEVEL_1_4.id]: LEVEL_1_4,
};

export function getLevel(id: string): LevelDefinition {
  const level = LEVELS[id];
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export function getZone(levelId: string, zoneId: string): ZoneDefinition {
  const level = getLevel(levelId);
  const zone = level.zones[zoneId];
  if (!zone) throw new Error(`Unknown zone: ${zoneId} (level: ${levelId})`);
  return zone;
}

export function getZoneDims(levelId: string, zoneId: string): { cols: number; rows: number; w: number; h: number } {
  const zone = getZone(levelId, zoneId);
  const rows = zone.map.length;
  const cols = zone.map[0]?.length ?? 0;
  return { cols, rows, w: cols * 48, h: rows * 48 };
}
