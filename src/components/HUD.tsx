import React from 'react';
import '../styles/hud.scss';

interface HUDProps {
  score: number;
  lives: number;
  coinsCollected: number;
}

interface HUDSection {
  label: string;
  value: string | number | React.ReactNode;
  formatter?: (value: any) => string;
}

function HUDSection({ label, value, formatter }: HUDSection): React.ReactElement {
  const displayValue = formatter ? formatter(value) : value;
  
  return (
    <div className="hud__section">
      <span className="hud__label">{label}</span>
      <span className="hud__value">{displayValue}</span>
    </div>
  );
}

function LivesSection({ lives }: { lives: number }): React.ReactElement {
  return (
    <div className="hud__section">
      <span className="hud__label">LIVES</span>
      <div className="hud__lives">
        {Array.from({ length: lives }, (_, i) => (
          <span key={i} className="life-icon">❤</span>
        ))}
      </div>
    </div>
  );
}

function HUD({ score, lives, coinsCollected }: HUDProps): React.ReactElement {
  const hudSections: HUDSection[] = [
    {
      label: 'SCORE',
      value: score,
      formatter: (val: number) => String(val).padStart(6, '0'),
    },
    {
      label: 'COINS',
      value: coinsCollected,
    },
    {
      label: 'WORLD',
      value: '1-1',
    },
  ];

  return (
    <div className="hud">
      {hudSections.map((section) => (
        <HUDSection 
          key={section.label}
          label={section.label}
          value={section.value}
          formatter={section.formatter}
        />
      ))}
      <LivesSection lives={lives} />
    </div>
  );
}

export default HUD;
