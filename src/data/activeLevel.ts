import { getLevel, type LevelDefinition } from './levels';

let activeLevelId = '1-1';

export function getActiveLevelId(): string {
  return activeLevelId;
}

export function setActiveLevelId(levelId: string): void {
  activeLevelId = levelId;
}

export function getActiveLevel(): LevelDefinition {
  return getLevel(activeLevelId);
}
