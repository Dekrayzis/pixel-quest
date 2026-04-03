import React from 'react';
import { Player as PlayerType } from '../types';
import { buildClassName, timeUtils, entityStyle } from '../utils/className';
import '../styles/player.scss';

interface PlayerProps {
  player: PlayerType;
  now: number;
}

function Player({ player, now }: PlayerProps): React.ReactElement {
  const {
    facing, big, state,
    invincibleUntil, growingUntil, firePowerUntil,
  } = player;
  const isInvincible = timeUtils.isActive(invincibleUntil, now);
  const isGrowing = timeUtils.isActive(growingUntil, now);
  const hasFirePower = timeUtils.isActive(firePowerUntil, now);
  // Flash warning in last 3 seconds of fire power
  const fireExpiring = timeUtils.isExpiringSoon(firePowerUntil, now, 3000);

  const className = buildClassName('player', {
    [`player--${state}`]: true,
    'player--facing-left': facing === -1,
    'player--big': big,
    'player--growing': isGrowing,
    'player--invincible': isInvincible,
    'player--fire': hasFirePower,
    'player--fire-expiring': fireExpiring,
  });

  return (
    <div
      className={className}
      style={entityStyle(player)}
    >
      <div className="player__body">
        <div className="player__cap" />
        <div className="player__hair" />
        <div className="player__face">
          <div className="player__eye" />
          <div className="player__nose" />
          <div className="player__sideburn" />
        </div>
        <div className="player__shirt" />
        <div className="player__overalls">
          <div className="player__button" />
        </div>
        <div className="player__shoes" />
      </div>
    </div>
  );
}

export default Player;
