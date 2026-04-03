import React from 'react';
import '../styles/gameover.scss';

interface OverlayConfig {
  modifier: string;
  title: string;
  subtitle?: string;
  showScore?: boolean;
  prompt: string;
  controls?: React.ReactNode;
}

const OVERLAY_CONFIGS: Record<string, OverlayConfig> = {
  start: {
    modifier: 'start',
    title: 'PIXEL QUEST',
    subtitle: 'Emerald Plains',
    prompt: 'Press ENTER to Start',
    controls: (
      <>
        Arrow Keys / WASD — Move &amp; Jump<br />
        Space — Jump<br />
        F — Fire
      </>
    ),
  },
  won: {
    modifier: 'win',
    title: 'YOU WIN!',
    subtitle: 'Emerald Plains Cleared!',
    showScore: true,
    prompt: 'Press ENTER to Play Again',
  },
  lost: {
    modifier: 'lose',
    title: 'GAME OVER',
    showScore: true,
    prompt: 'Press ENTER to Retry',
  },
};

export default function GameOverScreen({ status, score }: { status: string; score: number }): React.ReactElement | null {
  const config = OVERLAY_CONFIGS[status];
  if (!config) return null;

  return (
    <div className={`game-overlay game-overlay--${config.modifier}`}>
      <div className="game-overlay__title">{config.title}</div>
      {config.subtitle && <div className="game-overlay__subtitle">{config.subtitle}</div>}
      {config.showScore && <div className="game-overlay__score">Score: {score}</div>}
      <div className="game-overlay__prompt">{config.prompt}</div>
      {config.controls && <div className="game-overlay__controls">{config.controls}</div>}
    </div>
  );
}
