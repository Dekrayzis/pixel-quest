import React from 'react';
import '../styles/player.scss';

const Player = React.memo(function Player({ player, now }) {
  const {
    x, y, width, height, facing, big, state,
    invincibleUntil, growingUntil, firePowerUntil,
  } = player;
  const isInvincible = invincibleUntil > now;
  const isGrowing = growingUntil > now;
  const hasFirePower = firePowerUntil > now;
  // Flash warning in last 3 seconds of fire power
  const fireExpiring = hasFirePower && (firePowerUntil - now) < 3000;

  const classNames = [
    'player',
    `player--${state}`,
    facing === -1 ? 'player--facing-left' : '',
    big ? 'player--big' : '',
    isGrowing ? 'player--growing' : '',
    isInvincible ? 'player--invincible' : '',
    hasFirePower ? 'player--fire' : '',
    fireExpiring ? 'player--fire-expiring' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={{
        left: x,
        top: y,
        width,
        height,
      }}
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
});

export default Player;
