import React from 'react';
import '../styles/hud.scss';

const HUD = React.memo(function HUD({ score, lives, coinsCollected }) {
  return (
    <div className="hud">
      <div className="hud__section">
        <span className="hud__label">SCORE</span>
        <span className="hud__value">{String(score).padStart(6, '0')}</span>
      </div>

      <div className="hud__section">
        <span className="hud__label">COINS</span>
        <span className="hud__value">{coinsCollected}</span>
      </div>

      <div className="hud__section">
        <span className="hud__label">LIVES</span>
        <div className="hud__lives">
          {Array.from({ length: lives }, (_, i) => (
            <span key={i} className="life-icon">❤</span>
          ))}
        </div>
      </div>

      <div className="hud__section">
        <span className="hud__label">WORLD</span>
        <span className="hud__value">1-1</span>
      </div>
    </div>
  );
});

export default HUD;
