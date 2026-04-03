import React, { useEffect, useMemo, useRef, useReducer, useState, useCallback } from 'react';
import { VIEWPORT_W, VIEWPORT_H, TILE } from '../config/constants';
import { LEVEL_W, UNDERGROUND_W } from '../data/level1';
import useInput from '../hooks/useInput';
import { tickGameState, createInitialState } from '../hooks/useGameState';

import Player from './Player';
import Enemy from './Enemy';
import Platform from './Platform';
import Coin from './Coin';
import Projectile from './Projectile';
import PowerUp from './PowerUp';
import FlagPole from './FlagPole';
import HUD from './HUD';
import GameOverScreen from './GameOverScreen';

import '../styles/game.scss';

/**
 * Main game component.
 * Uses a ref for mutable game state and useReducer for force-updating React.
 * The rAF loop lives directly in a useEffect to avoid indirection bugs.
 */
export default function Game(): React.ReactElement {
  const { keys, consumeJustPressed } = useInput();
  const stateRef = useRef(createInitialState());
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  const [scale, setScale] = useState(1);

  // Responsive scaling — fit game viewport to window
  const updateScale = useCallback(() => {
    const sx = window.innerWidth / VIEWPORT_W;
    const sy = window.innerHeight / VIEWPORT_H;
    setScale(Math.min(sx, sy, 1)); // never upscale past 1
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const state = stateRef.current;

  // ── Main game loop — fixed 60fps timestep ──
  useEffect(() => {
    let cancelled = false;
    let lastTime = 0;
    const FRAME_MS = 1000 / 60; // 16.67ms per tick
    let accumulator = 0;

    const loop = (timestamp: number) => {
      if (cancelled) return;

      if (lastTime === 0) lastTime = timestamp;
      const elapsed = Math.min(timestamp - lastTime, 50); // cap to avoid spiral
      lastTime = timestamp;
      accumulator += elapsed;

      const s = stateRef.current;
      let ticked = false;

      // Run fixed-step ticks to keep physics consistent across refresh rates
      while (accumulator >= FRAME_MS && !cancelled) {
        if (s.gameStatus === 'playing') {
          tickGameState(s, keys, consumeJustPressed);
          ticked = true;
        }
        accumulator -= FRAME_MS;
      }

      if (ticked) forceRender();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle Enter key for start / restart ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const s = stateRef.current;
        if (s.gameStatus === 'start') {
          s.gameStatus = 'playing';
          forceRender();
        } else if (s.gameStatus === 'won' || s.gameStatus === 'lost') {
          stateRef.current = createInitialState();
          stateRef.current.gameStatus = 'playing';
          forceRender();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Camera: follow player, clamped to level bounds (zone-aware) ──
  const zoneLevelW = state.currentZone === 'underground' ? UNDERGROUND_W : LEVEL_W;
  const cameraX = Math.max(
    0,
    Math.min(
      state.player.x - VIEWPORT_W / 2 + state.player.width / 2,
      Math.max(0, zoneLevelW - VIEWPORT_W)
    )
  );
  const isUnderground = state.currentZone === 'underground';
  const isWarping = state.warpState === 'transitioning';

  // Decorative background elements (clouds + hills, parallax)
  const bgElements = useMemo(() => {
    const clouds = [];
    const hills = [];
    for (let i = 0; i < 12; i++) {
      const mod = i % 2 === 0 ? '1' : '2';
      clouds.push(
        <div
          key={`cloud-${i}`}
          className={`bg-cloud bg-cloud--${mod}`}
          style={{ left: i * 320 + 60 }}
        />
      );
    }
    for (let i = 0; i < 20; i++) {
      const mod = (i % 3) + 1; // cycles 1, 2, 3
      const spacing = mod === 1 ? 280 : mod === 2 ? 200 : 240;
      hills.push(
        <div
          key={`hill-${i}`}
          className={`bg-hill bg-hill--${mod}`}
          style={{ left: i * spacing + (mod === 2 ? 80 : 20) }}
        />
      );
    }
    return { clouds, hills };
  }, []);

  return (
    <div
      className="game-scaler"
      style={{
        width: VIEWPORT_W * scale,
        height: VIEWPORT_H * scale,
      }}
    >
    <div
      className={`game-viewport${isUnderground ? ' game-viewport--underground' : ''}`}
      style={{
        width: VIEWPORT_W,
        height: VIEWPORT_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      tabIndex={0}
    >
      {/* Scrolling world container */}
      <div
        className="game-world"
        style={{ transform: `translateX(${-cameraX}px)` }}
      >
        {/* Background decorations (parallax at 0.3x) — hidden underground */}
        {!isUnderground && (
          <div style={{ transform: `translateX(${cameraX * 0.7}px)`, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            {bgElements.clouds}
            {bgElements.hills}
          </div>
        )}

        {/* Tiles */}
        <Platform
          brokenBricks={state.brokenBricks}
          usedBlocks={state.usedBlocks}
          bumpedBlocks={state.bumpedBlocks}
          breakingBricks={state.breakingBricks}
          cameraX={cameraX}
          currentZone={state.currentZone}
        />

        {/* Coins (zone-aware) */}
        {(isUnderground ? state.undergroundCoins : state.coins).map((coin: any) => {
          if (coin.x < cameraX - TILE || coin.x > cameraX + VIEWPORT_W + TILE) return null;
          return <Coin key={coin.id} coin={coin} now={state.now} />;
        })}

        {/* Power-ups */}
        {state.powerups.map((pu: any) => {
          if (pu.x < cameraX - TILE * 2 || pu.x > cameraX + VIEWPORT_W + TILE * 2) return null;
          return <PowerUp key={pu.id} powerup={pu} now={state.now} />;
        })}

        {/* Enemies (zone-filtered) */}
        {state.enemies.filter((e: any) => (e.zone || 'overworld') === state.currentZone).map((enemy: any) => {
          if (enemy.x < cameraX - TILE * 2 || enemy.x > cameraX + VIEWPORT_W + TILE * 2) return null;
          return <Enemy key={enemy.id} enemy={enemy} now={state.now} />;
        })}

        {/* Projectiles */}
        {state.projectiles.map((proj: any) => (
          <Projectile key={proj.id} projectile={proj} />
        ))}

        {/* Flag pole (overworld only) */}
        {!isUnderground && (
          <FlagPole
            flagReached={state.flagReached}
            flagSlideProgress={state.flagSlideProgress}
          />
        )}

        {/* Player */}
        <Player player={state.player} now={state.now} warping={state.warpState === 'sinking' || state.warpState === 'emerging'} />

        {/* Score/coin popups */}
        {state.popups.map((pop: any) => (
          <div
            key={pop.id}
            className={pop.type === 'coin' ? 'block-coin-popup' : 'score-popup'}
            style={{ left: pop.x, top: pop.y }}
          >
            {pop.type !== 'coin' && pop.text}
          </div>
        ))}
      </div>

      {/* HUD (fixed over viewport) */}
      <HUD
        score={state.score}
        lives={state.lives}
        coinsCollected={state.coinsCollected}
      />

      {/* Warp transition overlay */}
      {isWarping && (
        <div className="warp-overlay" />
      )}

      {/* Overlays */}
      <GameOverScreen
        status={state.gameStatus}
        score={state.score}
      />
    </div>
    </div>
  );
}
