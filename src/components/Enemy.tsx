import React from 'react';
import '../styles/enemy.scss';

function Enemy({ enemy, now }: { enemy: any; now: number }): React.ReactElement | null {
  const { type, x, y, width, height, vx, alive, defeatedAt, shellState } = enemy;
  const isDefeated = !alive;
  const isShell = type === 'turtle' && shellState === 'idle';
  const isShellMoving = type === 'turtle' && shellState === 'sliding';

  const classNames = [
    'enemy',
    isShell || isShellMoving ? 'enemy--shell' : `enemy--${type}`,
    isShellMoving ? 'enemy--shell-moving' : '',
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
        {type === 'turtle' && (
          <>
            <div className="enemy__shell" />
            <div className="enemy__turtle-head" />
            <div className="enemy__turtle-eye" />
            <div className="enemy__turtle-feet" />
          </>
        )}
      </div>
    </div>
  );
}

export default Enemy;
