import React from 'react';
import { getActiveLevel } from '../data/activeLevel';
import '../styles/flagpole.scss';

const FlagPole = React.memo(function FlagPole({ flagReached, flagSlideProgress }: { flagReached: boolean; flagSlideProgress: number }): React.ReactElement {
  const level = getActiveLevel();
  const flagPos = level.flagPos;
  // Flag position driven by the same tick as the player (via flagSlideProgress)
  const FLAG_TOP = 48;   // starts below the gold ball at the top
  const FLAG_BOTTOM = 248; // bottom position (just above base)

  let flagTop = FLAG_TOP;
  if (flagReached) {
    flagTop = FLAG_TOP + (FLAG_BOTTOM - FLAG_TOP) * (flagSlideProgress || 0);
  }

  return (
    <div
      className="flagpole"
      style={{ left: flagPos.x, top: flagPos.y, width: 60, height: 336 }}
    >
      <div className="flagpole__pole" />
      <div className="flagpole__ball" />
      <div
        className={`flagpole__flag${!flagReached ? ' flagpole__flag--waving' : ''}`}
        style={{ top: flagTop }}
      />
      <div className="flagpole__base" />
    </div>
  );
});

export default FlagPole;
