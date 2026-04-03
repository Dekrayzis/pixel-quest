import React from 'react';
import { Enemy as EnemyType } from '../types';
import { buildClassName, entityStyle } from '../utils/className';
import '../styles/enemy.scss';

interface EnemyProps {
  enemy: EnemyType;
  now: number;
}

function Enemy({ enemy, now }: EnemyProps): React.ReactElement | null {
  const { type, vx, alive, defeatedAt } = enemy;
  const isDefeated = !alive;

  const className = buildClassName('enemy', {
    [`enemy--${type}`]: true,
    'enemy--defeated': isDefeated,
    'enemy--facing-left': vx < 0,
  });

  // Don't render if defeated animation is done
  if (isDefeated && now - defeatedAt > 500) return null;

  return (
    <div
      className={className}
      style={entityStyle(enemy)}
    >
      <div className="enemy__body">
        {type === 'goomba' && (
          <>
            <div className="enemy__head" />
            <div className="enemy__eyes" />
            <div className="enemy__feet" />
          </>
        )}
        {type === 'flyer' && (
          <>
            <div className="enemy__body-core" />
            <div className="enemy__eyes" />
            <div className="enemy__wing enemy__wing--left" />
            <div className="enemy__wing enemy__wing--right" />
          </>
        )}
      </div>
    </div>
  );
}

export default Enemy;
