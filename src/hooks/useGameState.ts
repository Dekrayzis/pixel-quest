import {
  TILE,
  GRAVITY, MAX_FALL_SPEED,
  PLAYER, PROJECTILE, ENEMY,
  COIN_VALUE, BLOCK_COIN_COUNT, LIVES_START, POWERUP_SCORE,
  FLAG,
} from '../config/constants';
import {
  LEVEL_W, LEVEL_H,
  PLAYER_START, ENEMIES as ENEMY_SPAWNS,
  COINS as COIN_SPAWNS, FLAG_POS,
} from '../data/level1';
import { aabbOverlap, aabbPenetration, collisionSide } from '../utils/collision';
import { getSolidTilesInRect } from '../utils/physics';
import { createId, timeUtils } from '../utils/className';
import { GameState, InputState, Tile } from '../types';

/* ──────────────────────────────────────────────────────
   Helper functions
   ────────────────────────────────────────────────────── */

function createPopup(suffix: string, x: number, y: number, text: string, now: number, type?: 'coin' | 'score') {
  return { id: createId.popup(now, suffix), x, y, text, createdAt: now, type };
}

/* ──────────────────────────────────────────────────────
   Initial state factory
   ────────────────────────────────────────────────────── */
export function createInitialState(): GameState {
  return {
    player: {
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      width: PLAYER.WIDTH,
      height: PLAYER.HEIGHT,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1, // 1 = right, -1 = left
      big: false,
      firePowerUntil: 0, // timestamp when fire power expires
      doubleJumpUsed: false, // true if mid-air jump already used
      invincibleUntil: 0,
      growingUntil: 0,
      state: 'idle', // idle, walking, jumping, falling, firing
      lastFireTime: 0,
    },
    enemies: ENEMY_SPAWNS.map((e, i) => ({
      id: createId.enemy(i),
      type: e.type,
      x: e.x,
      y: e.y,
      width: e.type === 'goomba' ? ENEMY.GOOMBA.WIDTH : ENEMY.FLYER.WIDTH,
      height: e.type === 'goomba' ? ENEMY.GOOMBA.HEIGHT : ENEMY.FLYER.HEIGHT,
      vx: e.type === 'goomba' ? -ENEMY.GOOMBA.SPEED : ENEMY.FLYER.SPEED,
      vy: 0,
      alive: true,
      defeatedAt: 0,
      originY: e.y,
      phase: Math.random() * Math.PI * 2, // for flyer bob
    })),
    coins: COIN_SPAWNS.map((c, i) => ({
      id: createId.coin(i),
      x: c.x,
      y: c.y,
      width: 24,
      height: 24,
      collected: false,
      collectedAt: 0,
    })),
    powerups: [],
    projectiles: [],
    popups: [],
    // Tile state: track broken bricks and used item blocks
    brokenBricks: {},   // key: "row-col" -> true if broken
    usedBlocks: {},     // key: "row-col" -> true if used
    bumpedBlocks: {},    // key: "row-col" -> timestamp
    breakingBricks: {},  // key: "row-col" -> timestamp
    blockCoins: {},     // key: "row-col" -> remaining coin count
    score: 0,
    lives: LIVES_START,
    coinsCollected: 0,
    gameStatus: 'start', // start, playing, won, lost
    flagReached: false,
    flagAnimStart: 0,
    flagPhase: null, // null | 'sliding' | 'grounded' | 'walking'
    flagSlideStartY: 0,
    flagSlideProgress: 0, // 0..1, driven by tick
    flagGroundedAt: 0,
    now: 0,
  };
}

/* ──────────────────────────────────────────────────────
   Tick — called once per frame from the Game component.
   Mutates the state object in-place.
   ────────────────────────────────────────────────────── */
export function tickGameState(s: GameState, keys: InputState['keys'], consumeJustPressed: (key: string) => boolean): void {
  const now = performance.now();
  s.now = now;

  // ── Flag pole sequence (overrides normal movement) ──
  const p = s.player;

  if (s.flagReached) {
    updateFlagSequence(s, now);
    // Still update popups/bricks during flag sequence
    timeUtils.cleanupByAge(s.popups, now, 1000);
    timeUtils.cleanupByTimestamp(s.breakingBricks, now, 600);
    return;
  }

  // ── Player input & physics ──
  if (keys.left) {
    p.vx = -PLAYER.SPEED;
    p.facing = -1;
  } else if (keys.right) {
    p.vx = PLAYER.SPEED;
    p.facing = 1;
  } else {
    p.vx *= 0.8; // friction
  }

  // Jumping
  if (consumeJustPressed('up') || consumeJustPressed('space')) {
    if (p.onGround) {
      p.vy = PLAYER.JUMP_FORCE;
      p.onGround = false;
      p.doubleJumpUsed = false;
      p.state = 'jumping';
    } else if (!p.doubleJumpUsed) {
      p.vy = PLAYER.DOUBLE_JUMP_FORCE;
      p.doubleJumpUsed = true;
      p.state = 'jumping';
    }
  }

  // Apply gravity
  p.vy = Math.min(p.vy + GRAVITY, MAX_FALL_SPEED);
  
  // Update position
  p.x += p.vx;
  p.y += p.vy;

  // Update player state
  if (p.onGround) {
    if (Math.abs(p.vx) > 0.5) {
      p.state = 'walking';
    } else {
      p.state = 'idle';
    }
  } else if (p.vy < 0) {
    p.state = 'jumping';
  } else {
    p.state = 'falling';
  }

  // Resolve collisions
  resolvePlayerTileCollisionsX(s);
  resolvePlayerTileCollisionsY(s);

  // Keep player in bounds
  p.x = Math.max(0, Math.min(p.x, LEVEL_W - p.width));
  if (p.y > LEVEL_H + 100) {
    // Fell off the level
    s.lives--;
    if (s.lives <= 0) {
      s.gameStatus = 'lost';
    } else {
      // Respawn
      p.x = PLAYER_START.x;
      p.y = PLAYER_START.y;
      p.vx = 0;
      p.vy = 0;
      p.big = false;
      p.height = PLAYER.HEIGHT;
      p.firePowerUntil = 0;
      p.invincibleUntil = now + 2000;
    }
  }

  // ── Projectile firing (only when fire power is active) ──
  if (timeUtils.isActive(p.firePowerUntil, now) && consumeJustPressed('fire') && now - p.lastFireTime > PLAYER.FIRE_COOLDOWN) {
    p.lastFireTime = now;
    p.state = 'firing';
    s.projectiles.push({
      id: createId.projectile(now),
      x: p.facing === 1 ? p.x + p.width : p.x - PROJECTILE.WIDTH,
      y: p.y + p.height / 2 - PROJECTILE.HEIGHT / 2,
      width: PROJECTILE.WIDTH,
      height: PROJECTILE.HEIGHT,
      vx: PROJECTILE.SPEED * p.facing,
      vy: -3, // initial upward arc
      createdAt: now,
      direction: p.facing,
    });
  }

  // ── Update projectiles ──────────────────────────
  updateProjectiles(s, now);

  // ── Update enemies ──────────────────────────────
  updateEnemies(s, now);

  // ── Update powerups ────────────────────────────
  updatePowerUps(s, now);

  // ── Check collisions ───────────────────────────
  checkPlayerCoinCollisions(s, now);
  checkPlayerPowerupCollisions(s, now);
  checkFlagCollision(s, now);

  // ── Cleanup old popups/animations ────────────────
  timeUtils.cleanupByAge(s.popups, now, 1000);
  timeUtils.cleanupByTimestamp(s.breakingBricks, now, 600);
  for (const key in s.bumpedBlocks) {
    if (now - s.bumpedBlocks[key] > 300) delete s.bumpedBlocks[key];
  }
}

/* ──────────────────────────────────────────────────────
   Collision resolution
   ────────────────────────────────────────────────────── */
function resolvePlayerTileCollisionsX(s: GameState): void {
  const p = s.player;
  const tiles = getSolidTilesInRect(p);
  
  for (const tile of tiles) {
    const key = `${tile.row}-${tile.col}`;
    if (s.brokenBricks[key]) continue;
    
    const pen = aabbPenetration(p, tile);
    if (!pen) continue;
    
    if (pen.x !== 0) {
      if (pen.x > 0) {
        p.x = tile.x + tile.width;
      } else {
        p.x = tile.x - p.width;
      }
      p.vx = 0;
    }
  }
}

function resolvePlayerTileCollisionsY(s: GameState): void {
  const p = s.player;
  const tiles = getSolidTilesInRect(p);
  let onGround = false;
  
  for (const tile of tiles) {
    const key = `${tile.row}-${tile.col}`;
    if (s.brokenBricks[key]) continue;
    
    const pen = aabbPenetration(p, tile);
    if (!pen) continue;
    
    if (pen.y !== 0) {
      if (pen.y > 0) {
        p.y = tile.y + tile.height;
        p.vy = 0;
      } else {
        p.y = tile.y - p.height;
        p.vy = 0;
        onGround = true;
      }
    }
  }
  
  p.onGround = onGround;
  
  // Check for block hits from below
  if (p.vy < 0) {
    const headY = p.y - 1;
    const headTiles = getSolidTilesInRect({
      x: p.x + 2,
      y: headY,
      width: p.width - 4,
      height: 1,
    });
    
    for (const tile of headTiles) {
      const key = `${tile.row}-${tile.col}`;
      if (s.usedBlocks[key] || s.brokenBricks[key]) continue;
      handleBlockHitFromBelow(s, tile, key);
    }
  }
}

/* ──────────────────────────────────────────────────────
   Block interactions
   ────────────────────────────────────────────────────── */
function handleBlockHitFromBelow(s: GameState, tile: Tile, key: string): void {
  const now = s.now;

  if (tile.type === 2) {
    // Brick: break if big, bump if small
    if (s.player.big) {
      s.brokenBricks[key] = true;
      s.breakingBricks[key] = now;
      s.score += 50;
      s.popups.push(createPopup(`${key}`, tile.x, tile.y - 20, '50', now));
    } else {
      s.bumpedBlocks[key] = now;
    }
  } else if (tile.type === 3 && !s.usedBlocks[key]) {
    // Multi-coin block: initialize counter on first hit
    if (s.blockCoins[key] === undefined) {
      s.blockCoins[key] = BLOCK_COIN_COUNT;
    }
    s.blockCoins[key] -= 1;
    s.bumpedBlocks[key] = now;
    s.score += COIN_VALUE;
    s.coinsCollected += 1;
    s.popups.push(createPopup(`${key}-${s.blockCoins[key]}`, tile.x, tile.y - 20, `${COIN_VALUE}`, now, 'coin'));

    if (s.blockCoins[key] <= 0) {
      // Last coin — block breaks into pieces and disappears
      s.usedBlocks[key] = true;
      s.breakingBricks[key] = now;
    }
  } else if (tile.type === 4 && !s.usedBlocks[key]) {
    // Regular coin block
    s.usedBlocks[key] = true;
    s.bumpedBlocks[key] = now;
    s.score += COIN_VALUE;
    s.coinsCollected += 1;
    s.popups.push(createPopup(`${key}`, tile.x, tile.y - 20, `${COIN_VALUE}`, now, 'coin'));
  } else if (tile.type === 6 && !s.usedBlocks[key]) {
    // Fire flower
    s.usedBlocks[key] = true;
    s.bumpedBlocks[key] = now;
    s.powerups.push({
      id: createId.powerup(now, key),
      x: tile.x,
      y: tile.y - TILE,
      width: TILE,
      height: TILE,
      active: false,
      collected: false,
      emergedAt: now,
      puType: 'fireflower',
      vx: 0,
      vy: 0,
    });
  } else if (tile.type === 5) {
    // Solid — just bump visual
    s.bumpedBlocks[key] = now;
  }
}

/* ──────────────────────────────────────────────────────
   Entity updates
   ────────────────────────────────────────────────────── */
function updateProjectiles(s: GameState, now: number): void {
  const PROJ_GRAVITY = 0.5;
  const PROJ_BOUNCE_VY = -6; // upward velocity on bounce
  const PROJ_MAX_BOUNCES = 4;

  s.projectiles = s.projectiles.filter((proj) => {
    // Apply gravity
    proj.vy = (proj.vy || 0) + PROJ_GRAVITY;
    proj.x += proj.vx!;
    proj.y += proj.vy;

    // Check lifetime
    if (now - proj.createdAt > PROJECTILE.LIFETIME) return false;

    // Fell off the level
    if (proj.y > LEVEL_H + 50) return false;

    // Tile collisions — bounce off ground, die on walls
    const tiles = getSolidTilesInRect(proj);
    for (const tile of tiles) {
      const key = `${tile.row}-${tile.col}`;
      if (s.brokenBricks[key]) continue;

      const pen = aabbPenetration(proj, tile);
      if (!pen) continue;
      const side = collisionSide(proj, tile, pen);

      if (side === 'top' && proj.vy > 0) {
        // Bounce off the top of a tile (ground)
        proj.y = tile.y - proj.height;
        proj.vy = PROJ_BOUNCE_VY;
        proj.bounces = (proj.bounces || 0) + 1;
        if (proj.bounces > PROJ_MAX_BOUNCES) return false;
      } else if (side === 'left' || side === 'right') {
        // Hit a wall — break bricks or die
        if (tile.type === 2) {
          s.brokenBricks[`${tile.row}-${tile.col}`] = true;
          s.breakingBricks[`${tile.row}-${tile.col}`] = now;
          s.score += 50;
        }
        return false;
      } else if (side === 'bottom') {
        // Hit ceiling — just reverse
        proj.vy = Math.abs(proj.vy) * 0.5;
      }
    }

    // Enemy collisions
    for (const enemy of s.enemies) {
      if (!enemy.alive) continue;
      if (aabbOverlap(proj, enemy)) {
        enemy.alive = false;
        enemy.defeatedAt = now;
        s.score += 200;
        s.popups.push(createPopup(`enemy-${enemy.id}`, enemy.x, enemy.y - 20, '200', now));
        return false;
      }
    }

    return true;
  });
}

function updateEnemies(s: GameState, now: number): void {
  for (const enemy of s.enemies) {
    if (!enemy.alive) continue;

    if (enemy.type === 'goomba') {
      // Simple patrol
      enemy.x += enemy.vx;
      
      // Turn around at edges or walls
      const tiles = getSolidTilesInRect({
        x: enemy.x + (enemy.vx > 0 ? enemy.width : -2),
        y: enemy.y + 5,
        width: 2,
        height: enemy.height - 10,
      });
      
      if (tiles.length === 0 || enemy.x <= 0 || enemy.x >= LEVEL_W - enemy.width) {
        enemy.vx = -enemy.vx;
      }
    } else if (enemy.type === 'flyer') {
      // Bob up and down
      enemy.phase += ENEMY.FLYER.FREQUENCY;
      enemy.y = enemy.originY + Math.sin(enemy.phase) * ENEMY.FLYER.AMPLITUDE;
      
      // Horizontal movement
      enemy.x += enemy.vx;
      
      // Turn around at level bounds
      if (enemy.x <= 0 || enemy.x >= LEVEL_W - enemy.width) {
        enemy.vx = -enemy.vx;
      }
    }

    // Check collision with player
    if (aabbOverlap(s.player, enemy)) {
      const playerTop = s.player.y;
      const enemyTop = enemy.y;
      
      if (playerTop < enemyTop && s.player.vy > 0) {
        // Player jumped on enemy
        enemy.alive = false;
        enemy.defeatedAt = now;
        s.score += 100;
        s.popups.push(createPopup(`enemy-${enemy.id}`, enemy.x, enemy.y - 20, '100', now));
        s.player.vy = -8; // bounce
      } else if (now > s.player.invincibleUntil) {
        // Enemy hurt player
        if (s.player.big) {
          s.player.big = false;
          s.player.height = PLAYER.HEIGHT;
          s.player.y += PLAYER.BIG_HEIGHT - PLAYER.HEIGHT;
          s.player.invincibleUntil = now + 2000;
        } else {
          s.lives--;
          if (s.lives <= 0) {
            s.gameStatus = 'lost';
          } else {
            // Respawn
            s.player.x = PLAYER_START.x;
            s.player.y = PLAYER_START.y;
            s.player.vx = 0;
            s.player.vy = 0;
            s.player.invincibleUntil = now + 2000;
          }
        }
      }
    }
  }

  // Remove defeated enemies after animation
  s.enemies = s.enemies.filter((e) => e.alive || now - e.defeatedAt < 500);
}

function updatePowerUps(s: GameState, now: number): void {
  for (const pu of s.powerups) {
    if (pu.collected) continue;

    // Activate after emergence animation
    if (!pu.active && now - pu.emergedAt > 600) {
      pu.active = true;
      pu.vx = pu.puType === 'mushroom' ? 2 : 0;
    }

    // Move powerup
    pu.x += pu.vx!;
    pu.vy = Math.min((pu.vy || 0) + GRAVITY, MAX_FALL_SPEED);
    pu.y += pu.vy;

    // Powerup tile collision
    const tiles = getSolidTilesInRect(pu);
    for (const tile of tiles) {
      const key = `${tile.row}-${tile.col}`;
      if (s.brokenBricks[key]) continue;
      const pen = aabbPenetration(pu, tile);
      if (!pen) continue;
      const side = collisionSide(pu, tile, pen);
      if (side === 'top') {
        pu.y = tile.y - pu.height;
        pu.vy = 0;
      } else if (side === 'left' || side === 'right') {
        pu.vx = -pu.vx!;
      }
    }

    // Player pickup
    if (aabbOverlap(s.player, pu)) {
      pu.collected = true;
      if (pu.puType === 'fireflower') {
        // Fire flower: grant timed fire power only (no grow)
        s.player.firePowerUntil = now + PLAYER.FIRE_POWER_DURATION;
      } else {
        // Mushroom: grow big
        if (!s.player.big) {
          s.player.big = true;
          s.player.y -= (PLAYER.BIG_HEIGHT - PLAYER.HEIGHT);
          s.player.height = PLAYER.BIG_HEIGHT;
          s.player.growingUntil = now + 500;
        }
      }
      s.score += POWERUP_SCORE;
      s.popups.push(createPopup('pu', pu.x, pu.y - 20, `${POWERUP_SCORE}`, now));
    }
  }

  // Remove collected powerups after animation
  s.powerups = s.powerups.filter((pu) => !pu.collected || now - pu.emergedAt < 2000);
}

/* ──────────────────────────────────────────────────────
   Collision checks
   ────────────────────────────────────────────────────── */
function checkPlayerCoinCollisions(s: GameState, now: number): void {
  for (const coin of s.coins) {
    if (coin.collected) continue;
    
    if (aabbOverlap(s.player, coin)) {
      coin.collected = true;
      coin.collectedAt = now;
      s.score += COIN_VALUE;
      s.coinsCollected += 1;
      s.popups.push(createPopup(`coin-${coin.id}`, coin.x, coin.y - 20, `${COIN_VALUE}`, now, 'coin'));
    }
  }

  // Remove collected coins after animation
  s.coins = s.coins.filter((coin) => !coin.collected || now - coin.collectedAt < 500);
}

function checkPlayerPowerupCollisions(_s: GameState, _now: number): void {
  // This is handled in updatePowerUps
}

function checkFlagCollision(s: GameState, now: number): void {
  if (s.flagReached) return;

  const p = s.player;
  const flag = {
    x: FLAG_POS.x,
    y: FLAG_POS.y,
    width: FLAG.WIDTH,
    height: FLAG.HEIGHT,
  };

  if (aabbOverlap(p, flag)) {
    s.flagReached = true;
    s.flagAnimStart = now;
    s.flagPhase = 'sliding';
    s.flagSlideStartY = p.y;
    s.score += 1000;
    // Snap player to the pole and freeze
    p.x = FLAG_POS.x - p.width + 6; // hug the pole
    p.vx = 0;
    p.vy = 0;
    p.facing = 1;
    p.state = 'idle';
  }
}

// Ground Y = row 10 * TILE - playerHeight (top of ground tiles)
const FLAG_GROUND_Y = 10 * TILE;
const FLAG_SLIDE_DURATION = 1000; // ms to slide down
const FLAG_PAUSE_DURATION = 400;  // ms pause at bottom before walking
const FLAG_WALK_TARGET_X = FLAG_POS.x + 4 * TILE; // walk 4 tiles past pole

function updateFlagSequence(s: GameState, now: number): void {
  const p = s.player;
  const elapsed = now - s.flagAnimStart!;

  if (s.flagPhase === 'sliding') {
    // Slide player down the pole
    const slideProgress = Math.min(elapsed / FLAG_SLIDE_DURATION, 1);
    s.flagSlideProgress = slideProgress;
    const targetY = FLAG_GROUND_Y - p.height;
    p.y = s.flagSlideStartY + (targetY - s.flagSlideStartY) * slideProgress;
    p.x = FLAG_POS.x - p.width + 6;
    p.vx = 0;
    p.vy = 0;
    p.state = 'idle';

    if (slideProgress >= 1) {
      s.flagPhase = 'grounded';
      s.flagSlideProgress = 1;
      s.flagGroundedAt = now;
      p.y = targetY;
      p.onGround = true;
    }
  } else if (s.flagPhase === 'grounded') {
    // Brief pause at the bottom, then start walking
    p.vx = 0;
    p.state = 'idle';
    p.facing = 1;

    if (now - s.flagGroundedAt > FLAG_PAUSE_DURATION) {
      s.flagPhase = 'walking';
      // Move player to the right side of the pole
      p.x = FLAG_POS.x + 10;
      p.facing = 1;
    }
  } else if (s.flagPhase === 'walking') {
    // Auto-walk right
    p.vx = PLAYER.SPEED * 0.8;
    p.x += p.vx;
    p.state = 'walking';
    p.facing = 1;

    // Apply gravity + ground collision while walking
    p.vy = Math.min(p.vy + GRAVITY, MAX_FALL_SPEED);
    p.y += p.vy;
    resolvePlayerTileCollisionsY(s);

    if (p.x >= FLAG_WALK_TARGET_X) {
      s.gameStatus = 'won';
    }
  }
}
