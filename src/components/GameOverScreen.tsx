import React from 'react';
import { buildClassName } from '../utils/className';
import '../styles/gameover.scss';

interface GameOverScreenProps {
  status: 'start' | 'playing' | 'won' | 'lost';
  score: number;
}

interface OverlayContent {
  title: string;
  subtitle?: string;
  score?: boolean;
  prompt: string;
  controls?: React.ReactNode;
}

const overlayConfigs: Record<string, OverlayContent> = {
  start: {
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
    title: 'YOU WIN!',
    subtitle: 'Emerald Plains Cleared!',
    score: true,
    prompt: 'Press ENTER to Play Again',
  },
  lost: {
    title: 'GAME OVER',
    score: true,
    prompt: 'Press ENTER to Retry',
  },
};

function GameOverlay({ status, content, score }: { status: string; content: OverlayContent; score: number }): React.ReactElement {
  const className = buildClassName('game-overlay', {
    [`game-overlay--${status}`]: true,
  });

  return (
    <div className={className}>
      <div className="game-overlay__title">{content.title}</div>
      {content.subtitle && (
        <div className="game-overlay__subtitle">{content.subtitle}</div>
      )}
      {content.score && (
        <div className="game-overlay__score">Score: {score}</div>
      )}
      <div className="game-overlay__prompt">{content.prompt}</div>
      {content.controls && (
        <div className="game-overlay__controls">{content.controls}</div>
      )}
    </div>
  );
}

export default function GameOverScreen({ status, score }: GameOverScreenProps): React.ReactElement | null {
  if (status === 'playing') return null;

  const content = overlayConfigs[status];
  if (!content) return null;

  return <GameOverlay status={status} content={content} score={score} />;
}
