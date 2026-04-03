import React from 'react';
import '../styles/powerup.scss';

function PowerUp({ powerup, now }: { powerup: any; now: number }): React.ReactElement | null {
  const { x, y, width, height, active, collected, emergedAt, puType } = powerup;

  // Remove after collected animation
  if (collected && now - emergedAt > 2000) return null;

  const isEmerging = now - emergedAt < 600;
  const isFireFlower = puType === 'fireflower';

  const className = [
    'powerup',
    isFireFlower ? 'powerup--flower' : 'powerup--mushroom',
    isEmerging ? 'powerup--emerging' : '',
    active && !collected ? 'powerup--active' : '',
    collected ? 'powerup--collected' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      style={{ left: x, top: y, width, height }}
    >
      {isFireFlower ? (
        <div className="powerup__body powerup__body--flower">
          <div className="powerup__petal powerup__petal--1" />
          <div className="powerup__petal powerup__petal--2" />
          <div className="powerup__petal powerup__petal--3" />
          <div className="powerup__petal powerup__petal--4" />
          <div className="powerup__center" />
          <div className="powerup__stem powerup__stem--flower" />
        </div>
      ) : (
        <div className="powerup__body">
          <div className="powerup__cap" />
          <div className="powerup__stem" />
        </div>
      )}
    </div>
  );
}

export default PowerUp;
