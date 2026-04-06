import { LEVELS } from '../data/levels';
import type { LevelDefinition } from '../data/levels';
import { TILE } from '../config/constants';
import type { EditorLevel, EditorZone, EditorEnemy, EditorCoin, EditorWarpPipe } from './types';
import { uid } from './types';

/** Return a list of all registered levels (id + displayName) */
export function getAvailableLevels(): { id: string; displayName: string }[] {
  return Object.values(LEVELS).map((l) => ({ id: l.id, displayName: l.displayName }));
}

/**
 * Convert a game LevelDefinition into the editor's mutable format.
 * Pixel positions are converted back to col/row grid coordinates.
 */
export function importLevelFromGame(levelId: string): EditorLevel | null {
  const gameLvl: LevelDefinition | undefined = LEVELS[levelId];
  if (!gameLvl) return null;

  const zones: Record<string, EditorZone> = {};

  for (const [zoneKey, zoneDef] of Object.entries(gameLvl.zones)) {
    const map = zoneDef.map.map((row) => [...row]);
    const rows = map.length;
    const cols = map[0]?.length ?? 0;

    const enemies: EditorEnemy[] = zoneDef.enemies.map((e) => {
      // Reverse of export: ground enemies use (row+1)*TILE - height, flyers use row*TILE
      const height = e.type === 'turtle' ? 52 : e.type === 'goomba' ? 44 : 0;
      const editorRow = e.type === 'flyer'
        ? Math.round(e.y / TILE)
        : Math.round((e.y + height) / TILE) - 1;
      return { id: uid(), type: e.type, col: Math.round(e.x / TILE), row: editorRow };
    });

    const coins: EditorCoin[] = zoneDef.coins.map((c) => ({
      id: uid(),
      col: Math.round(c.x / TILE),
      row: Math.round(c.y / TILE),
    }));

    zones[zoneKey] = {
      id: zoneKey,
      kind: zoneDef.kind,
      cols,
      rows,
      map,
      enemies,
      coins,
    };
  }

  const warpPipes: EditorWarpPipe[] = gameLvl.warpPipes.map((wp) => ({
    id: wp.id,
    entryZone: wp.entryZone,
    entryCol: wp.entryCol,
    entryRow: wp.entryRow,
    exitZone: wp.exitZone,
    exitCol: wp.exitCol,
    exitRow: wp.exitRow,
    exitPlayerCol: Math.round(wp.exitPlayerX / TILE),
    exitPlayerRow: Math.round(wp.exitPlayerY / TILE),
    emergeDirection: wp.emergeDirection,
  }));

  return {
    id: gameLvl.id,
    displayName: gameLvl.displayName,
    playerStartCol: Math.round(gameLvl.playerStart.x / TILE),
    playerStartRow: Math.round(gameLvl.playerStart.y / TILE),
    flagCol: Math.round(gameLvl.flagPos.x / TILE),
    flagRow: Math.round(gameLvl.flagPos.y / TILE),
    zones,
    warpPipes,
  };
}
