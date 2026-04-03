import React from 'react';
import { TILE } from '../config/constants';
import { getActiveLevel } from '../data/activeLevel';
import '../styles/platform.scss';
import '../styles/block.scss';

interface PlatformProps {
  brokenBricks: Record<string, boolean>;
  usedBlocks: Record<string, boolean>;
  bumpedBlocks: Record<string, number>;
  breakingBricks: Record<string, number>;
  cameraX: number;
  currentZone: string;
}

/**
 * Renders all static tiles (ground, bricks, item blocks, solid blocks).
 * Broken bricks and used blocks are tracked via state props.
 */
function Platform({
  brokenBricks,
  usedBlocks,
  bumpedBlocks,
  breakingBricks,
  cameraX,
  currentZone,
}: PlatformProps): React.ReactElement {
  const level = getActiveLevel();
  const zoneDef = level.zones[currentZone] ?? level.zones.overworld;
  const map = zoneDef.map;
  const rows = map.length;
  const cols = map[0]?.length ?? 0;

  // Only render tiles visible in viewport + buffer
  const startCol = Math.max(0, Math.floor(cameraX / TILE) - 2);
  const endCol = Math.min(cols - 1, Math.floor((cameraX + 960) / TILE) + 2);

  const tiles = [];

  for (let row = 0; row < rows; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const type = map[row][col];
      if (type === 0) continue;

      const key = `${row}-${col}`;

      // Skip fully broken bricks (but show breaking animation)
      if (brokenBricks[key] && !breakingBricks[key]) continue;

      const isBumped = bumpedBlocks[key];
      const isUsed = usedBlocks[key];
      const isBreaking = breakingBricks[key];

      let className = 'tile';

      if (isBreaking && brokenBricks[key]) {
        className += ' tile--brick-breaking';
        tiles.push(
          <div
            key={key}
            className={className}
            style={{ left: col * TILE, top: row * TILE }}
          >
            <div className="brick-fragment brick-fragment--tl" />
            <div className="brick-fragment brick-fragment--tr" />
            <div className="brick-fragment brick-fragment--bl" />
            <div className="brick-fragment brick-fragment--br" />
          </div>
        );
        continue;
      }

      const tileClassMap: Record<number, string | ((used: boolean) => string)> = {
        1: 'tile--ground',
        2: 'tile--brick',
        3: (used: boolean) => used ? 'tile--item tile--item-used' : 'tile--item',
        4: (used: boolean) => used ? 'tile--item tile--item-used' : 'tile--item',
        5: 'tile--solid',
        6: (used: boolean) => used ? 'tile--item tile--item-used' : 'tile--item tile--item-fire',
        7: 'tile--pipe-body',
        8: 'tile--pipe-top',
      };

      const entry = tileClassMap[type];
      if (!entry) continue;
      className += ` ${typeof entry === 'function' ? entry(!!isUsed) : entry}`;

      if (isBumped) {
        className += type === 2 ? ' tile--brick-bumped' : ' tile--item-bumped';
      }

      tiles.push(
        <div
          key={key}
          className={className}
          style={{ left: col * TILE, top: row * TILE }}
        >
          {(type === 3 || type === 4 || type === 6) && !isUsed && (
            <span className="tile__question">{type === 6 ? '★' : '?'}</span>
          )}
        </div>
      );
    }
  }

  return <>{tiles}</>;
}

export default Platform;
