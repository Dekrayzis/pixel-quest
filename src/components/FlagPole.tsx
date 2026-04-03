import React from 'react';
import { FLAG_POS } from '../data/level1';
import '../styles/flagpole.scss';

interface FlagPoleProps {
  flagReached: boolean;
  flagSlideProgress: number;
}

function FlagPole({ flagReached, flagSlideProgress }: FlagPoleProps): React.ReactElement {
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
      style={{ left: FLAG_POS.x, top: FLAG_POS.y, width: 60, height: 336 }}
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
}

export default FlagPole;
