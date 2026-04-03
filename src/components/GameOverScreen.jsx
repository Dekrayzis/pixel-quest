import React from 'react';
import '../styles/gameover.scss';

export default function GameOverScreen({ status, score, onRestart, onStart }) {
  if (status === 'start') {
    return (
      <div className="game-overlay game-overlay--start">
        <div className="game-overlay__title">PIXEL QUEST</div>
        <div className="game-overlay__subtitle">Emerald Plains</div>
        <div className="game-overlay__prompt">Press ENTER to Start</div>
        <div className="game-overlay__controls">
          Arrow Keys / WASD — Move &amp; Jump<br />
          Space — Jump<br />
          F — Fire
        </div>
      </div>
    );
  }

  if (status === 'won') {
    return (
      <div className="game-overlay game-overlay--win">
        <div className="game-overlay__title">YOU WIN!</div>
        <div className="game-overlay__subtitle">Emerald Plains Cleared!</div>
        <div className="game-overlay__score">Score: {score}</div>
        <div className="game-overlay__prompt">Press ENTER to Play Again</div>
      </div>
    );
  }

  if (status === 'lost') {
    return (
      <div className="game-overlay game-overlay--lose">
        <div className="game-overlay__title">GAME OVER</div>
        <div className="game-overlay__score">Score: {score}</div>
        <div className="game-overlay__prompt">Press ENTER to Retry</div>
      </div>
    );
  }

  return null;
}
