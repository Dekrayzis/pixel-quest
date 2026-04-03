import React from 'react';
import { TILE } from '../config/constants';
import { MAP, LEVEL_COLS, LEVEL_ROWS } from '../data/level1';
import '../styles/platform.scss';
import '../styles/block.scss';

/**
 * Renders all static tiles (ground, bricks, item blocks, solid blocks).
 * Broken bricks and used blocks are tracked via state props.
 */
const Platform = React.memo(function Platform({
  brokenBricks,
  usedBlocks,
  bumpedBlocks,
  breakingBricks,
  cameraX,
}) {
  // Only render tiles visible in viewport + buffer
  const startCol = Math.max(0, Math.floor(cameraX / TILE) - 2);
  const endCol = Math.min(LEVEL_COLS - 1, Math.floor((cameraX + 960) / TILE) + 2);

  const tiles = [];

  for (let row = 0; row < LEVEL_ROWS; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const type = MAP[row][col];
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

      switch (type) {
        case 1:
          className += ' tile--ground';
          break;
        case 2:
          className += ' tile--brick';
          break;
        case 3:
        case 4:
          className += isUsed ? ' tile--item tile--item-used' : ' tile--item';
          break;
        case 5:
          className += ' tile--solid';
          break;
        case 6:
          className += isUsed ? ' tile--item tile--item-used' : ' tile--item tile--item-fire';
          break;
        case 7:
          className += ' tile--pipe-body';
          break;
        case 8:
          className += ' tile--pipe-top';
          break;
        default:
          continue;
      }

      if (isBumped) {
        className += ' tile--item-bumped';
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
});

export default Platform;
