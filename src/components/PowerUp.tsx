import React from 'react';
import { PowerUp as PowerUpType } from '../types';
import { buildClassName, entityStyle } from '../utils/className';
import '../styles/powerup.scss';

interface PowerUpProps {
  powerup: PowerUpType;
  now: number;
}

function PowerUp({ powerup, now }: PowerUpProps): React.ReactElement | null {
  const { active, collected, emergedAt, puType } = powerup;

  // Remove after collected animation
  if (collected && now - emergedAt > 2000) return null;

  const isEmerging = now - emergedAt < 600;
  const isFireFlower = puType === 'fireflower';

  const className = buildClassName('powerup', {
    'powerup--flower': isFireFlower,
    'powerup--mushroom': !isFireFlower,
    'powerup--emerging': isEmerging,
    'powerup--active': active && !collected,
    'powerup--collected': collected,
  });

  return (
    <div
      className={className}
      style={entityStyle(powerup)}
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
