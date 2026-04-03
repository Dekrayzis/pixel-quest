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

function buildConfigs(levelName: string, hasNextLevel: boolean): Record<string, OverlayConfig> {
  return {
    start: {
      modifier: 'start',
      title: 'PIXEL QUEST',
      subtitle: levelName,
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
      title: hasNextLevel ? 'LEVEL CLEAR!' : 'YOU WIN!',
      subtitle: `${levelName} Cleared!`,
      showScore: true,
      prompt: hasNextLevel ? 'Press ENTER for Next Level' : 'Press ENTER to Play Again',
    },
    lost: {
      modifier: 'lose',
      title: 'GAME OVER',
      showScore: true,
      prompt: 'Press ENTER to Retry',
    },
  };
}

interface GameOverScreenProps {
  status: string;
  score: number;
  levelName?: string;
  hasNextLevel?: boolean;
}

export default function GameOverScreen({ status, score, levelName = 'Emerald Plains', hasNextLevel = false }: GameOverScreenProps): React.ReactElement | null {
  const config = buildConfigs(levelName, hasNextLevel)[status];
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
