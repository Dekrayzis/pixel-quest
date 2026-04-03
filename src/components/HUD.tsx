import React from 'react';
import '../styles/hud.scss';

interface HUDSectionConfig {
  label: string;
  render: () => React.ReactNode;
}

const HUD = React.memo(function HUD({ score, lives, coinsCollected }: { score: number; lives: number; coinsCollected: number }): React.ReactElement {
  const sections: HUDSectionConfig[] = [
    { label: 'SCORE', render: () => String(score).padStart(6, '0') },
    { label: 'COINS', render: () => coinsCollected },
    {
      label: 'LIVES',
      render: () => (
        <div className="hud__lives">
          {Array.from({ length: lives }, (_, i) => (
            <span key={i} className="life-icon">❤</span>
          ))}
        </div>
      ),
    },
    { label: 'WORLD', render: () => '1-1' },
  ];

  return (
    <div className="hud">
      {sections.map(({ label, render }) => (
        <div key={label} className="hud__section">
          <span className="hud__label">{label}</span>
          <span className="hud__value">{render()}</span>
        </div>
      ))}
    </div>
  );
});

export default HUD;
