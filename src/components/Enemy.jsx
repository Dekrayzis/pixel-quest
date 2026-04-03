import React from 'react';
import '../styles/enemy.scss';

const Enemy = React.memo(function Enemy({ enemy, now }) {
  const { type, x, y, width, height, vx, alive, defeatedAt } = enemy;
  const isDefeated = !alive;

  const classNames = [
    'enemy',
    `enemy--${type}`,
    isDefeated ? 'enemy--defeated' : '',
    vx < 0 ? 'enemy--facing-left' : '',
  ].filter(Boolean).join(' ');

  // Don't render if defeated animation is done
  if (isDefeated && now - defeatedAt > 500) return null;

  return (
    <div
      className={classNames}
      style={{ left: x, top: y, width, height }}
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
});

export default Enemy;
