import {
  TILE, VIEWPORT_W, VIEWPORT_H,
  GRAVITY, MAX_FALL_SPEED,
  PLAYER, PROJECTILE, ENEMY,
  COIN_VALUE, BLOCK_COIN_COUNT, LIVES_START, POWERUP_SCORE,
} from '../config/constants';
import {
  MAP, LEVEL_W, LEVEL_H, LEVEL_COLS, LEVEL_ROWS,
  PLAYER_START, ENEMIES as ENEMY_SPAWNS,
  COINS as COIN_SPAWNS, FLAG_POS,
} from '../data/level1';
import { aabbOverlap, aabbPenetration, collisionSide } from '../utils/collision';
import { getSolidTilesInRect, isSolidTile } from '../utils/physics';

/* ──────────────────────────────────────────────────────
   Initial state factory
   ────────────────────────────────────────────────────── */
export function createInitialState() {
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
      id: `enemy-${i}`,
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
      id: `coin-${i}`,
      x: c.x,
      y: c.y,
      width: 24,
      height: 28,
      collected: false,
      collectedAt: 0,
    })),
    projectiles: [],
    powerups: [],
    // Tile state: track broken bricks and used item blocks
    brokenBricks: {},   // key: "row-col"
    usedBlocks: {},     // key: "row-col"
    blockCoins: {},     // key: "row-col" -> remaining coin count (for multi-coin blocks)
    bumpedBlocks: {},   // key: "row-col" -> timestamp
    breakingBricks: {}, // key: "row-col" -> timestamp
    // Popups for score/coin visuals
    popups: [],
    score: 0,
    lives: LIVES_START,
    coinsCollected: 0,
    gameStatus: 'start', // start, playing, won, lost
    flagReached: false,
    flagAnimStart: 0,
    flagPhase: null, // null | 'sliding' | 'grounded' | 'walking'
    flagSlideStartY: 0,
    flagSlideProgress: 0, // 0..1, driven by tick
    now: 0,
  };
}

/* ──────────────────────────────────────────────────────
   Tick — called once per frame from the Game component.
   Mutates the state object in-place.
   ────────────────────────────────────────────────────── */
export function tickGameState(s, inputKeys, consumeJustPressed) {
  const now = performance.now();
  s.now = now;
  const keys = inputKeys.current;

  // ── Flag pole sequence (overrides normal movement) ──
  const p = s.player;

  if (s.flagReached) {
    updateFlagSequence(s, now);
    // Still update popups/bricks during flag sequence
    s.popups = s.popups.filter((pop) => now - pop.createdAt < 1000);
    for (const key in s.breakingBricks) {
      if (now - s.breakingBricks[key] > 600) delete s.breakingBricks[key];
    }
    for (const key in s.bumpedBlocks) {
      if (now - s.bumpedBlocks[key] > 300) delete s.bumpedBlocks[key];
    }
    return;
  }

  // ── Player movement ─────────────────────────────
  const speed = PLAYER.SPEED;

  // Horizontal
  if (keys.left && !keys.right) {
    p.vx = -speed;
    p.facing = -1;
  } else if (keys.right && !keys.left) {
    p.vx = speed;
    p.facing = 1;
  } else {
    p.vx = 0;
  }

  // Jump — ground jump + double jump in air
  if (consumeJustPressed('jump')) {
    if (p.onGround) {
      p.vy = PLAYER.JUMP_FORCE;
      p.onGround = false;
      p.doubleJumpUsed = false;
    } else if (!p.doubleJumpUsed) {
      p.vy = PLAYER.DOUBLE_JUMP_FORCE;
      p.doubleJumpUsed = true;
    }
  }

  // Reset double jump on landing
  if (p.onGround) {
    p.doubleJumpUsed = false;
  }

  // Expire fire power
  if (p.firePowerUntil > 0 && now > p.firePowerUntil) {
    p.firePowerUntil = 0;
  }

  // Gravity
  p.vy = Math.min(p.vy + GRAVITY, MAX_FALL_SPEED);

  // ── Move X then resolve ─────────────────────────
  p.x += p.vx;
  resolvePlayerTileCollisionsX(s);

  // ── Move Y then resolve ─────────────────────────
  p.y += p.vy;
  resolvePlayerTileCollisionsY(s);

  // Clamp to level bounds
  if (p.x < 0) p.x = 0;
  if (p.x + p.width > LEVEL_W) p.x = LEVEL_W - p.width;

  // Fell into pit
  if (p.y > LEVEL_H + 50) {
    handlePlayerDeath(s);
    return;
  }

  // ── Player animation state ──────────────────────
  if (p.vy < -1) {
    p.state = 'jumping';
  } else if (p.vy > 2) {
    p.state = 'falling';
  } else if (Math.abs(p.vx) > 0.5) {
    p.state = 'walking';
  } else {
    p.state = 'idle';
  }

  // ── Projectile firing (only when fire power is active) ──
  if (p.firePowerUntil > now && consumeJustPressed('fire') && now - p.lastFireTime > PLAYER.FIRE_COOLDOWN) {
    p.lastFireTime = now;
    p.state = 'firing';
    s.projectiles.push({
      id: `proj-${now}`,
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

  // ── Player vs enemies ───────────────────────────
  checkPlayerEnemyCollisions(s, now);

  // ── Player vs coins ─────────────────────────────
  checkPlayerCoinCollisions(s, now);

  // ── Player vs powerups ──────────────────────────
  checkPlayerPowerupCollisions(s, now);

  // ── Player vs flag ──────────────────────────────
  checkFlagCollision(s, now);

  // ── Cleanup dead popups ─────────────────────────
  s.popups = s.popups.filter((pop) => now - pop.createdAt < 1000);

  // ── Cleanup old breaking bricks ─────────────────
  for (const key in s.breakingBricks) {
    if (now - s.breakingBricks[key] > 600) {
      delete s.breakingBricks[key];
    }
  }

  // Cleanup old bumped blocks
  for (const key in s.bumpedBlocks) {
    if (now - s.bumpedBlocks[key] > 300) {
      delete s.bumpedBlocks[key];
    }
  }
}

/* ══════════════════════════════════════════════════════
   Helper functions (pure logic, operate on state obj)
   ══════════════════════════════════════════════════════ */

function resolvePlayerTileCollisionsX(s) {
  const p = s.player;
  const tiles = getSolidTilesInRect(p);

  for (const tile of tiles) {
    // Skip broken bricks
    const key = `${tile.row}-${tile.col}`;
    if (s.brokenBricks[key]) continue;

    const pen = aabbPenetration(p, tile);
    if (!pen) continue;

    const side = collisionSide(p, tile, pen);
    if (side === 'left') {
      p.x = tile.x - p.width;
      p.vx = 0;
    } else if (side === 'right') {
      p.x = tile.x + tile.width;
      p.vx = 0;
    }
  }
}

function resolvePlayerTileCollisionsY(s) {
  const p = s.player;
  const tiles = getSolidTilesInRect(p);
  p.onGround = false;

  for (const tile of tiles) {
    const key = `${tile.row}-${tile.col}`;
    if (s.brokenBricks[key]) continue;

    const pen = aabbPenetration(p, tile);
    if (!pen) continue;

    const side = collisionSide(p, tile, pen);
    if (side === 'top') {
      // Landing on top of a tile
      p.y = tile.y - p.height;
      p.vy = 0;
      p.onGround = true;
    } else if (side === 'bottom') {
      // Hit head on tile from below
      p.y = tile.y + tile.height;
      p.vy = 0;
      handleBlockHitFromBelow(s, tile, key);
    }
  }
}

function handleBlockHitFromBelow(s, tile, key) {
  const now = s.now;

  if (tile.type === 2) {
    // Brick: break if big, bump if small
    if (s.player.big) {
      s.brokenBricks[key] = true;
      s.breakingBricks[key] = now;
      s.score += 50;
      s.popups.push({ id: `pop-${now}-${key}`, x: tile.x, y: tile.y - 20, text: '50', createdAt: now });
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
    s.popups.push({ id: `pop-${now}-${key}-${s.blockCoins[key]}`, x: tile.x, y: tile.y - 20, text: `${COIN_VALUE}`, createdAt: now, type: 'coin' });

    if (s.blockCoins[key] <= 0) {
      // Last coin — block breaks into pieces and disappears
      s.usedBlocks[key] = true;
      s.brokenBricks[key] = true;
      s.breakingBricks[key] = now;
    }
  } else if (tile.type === 4 && !s.usedBlocks[key]) {
    // Item block (mushroom powerup)
    s.usedBlocks[key] = true;
    s.bumpedBlocks[key] = now;
    s.powerups.push({
      id: `pu-${now}-${key}`,
      puType: 'mushroom',
      x: tile.x + 4,
      y: tile.y - 40,
      width: 40,
      height: 40,
      vx: 1.5,
      vy: 0,
      active: false,
      emergedAt: now,
      collected: false,
    });
  } else if (tile.type === 6 && !s.usedBlocks[key]) {
    // Item block (fire flower)
    s.usedBlocks[key] = true;
    s.bumpedBlocks[key] = now;
    s.powerups.push({
      id: `pu-${now}-${key}`,
      puType: 'fireflower',
      x: tile.x + 4,
      y: tile.y - 40,
      width: 40,
      height: 40,
      vx: 0, // fire flower doesn't move horizontally
      vy: 0,
      active: false,
      emergedAt: now,
      collected: false,
    });
  } else if (tile.type === 5) {
    // Solid — just bump visual
    s.bumpedBlocks[key] = now;
  }
}

function updateProjectiles(s, now) {
  const PROJ_GRAVITY = 0.5;
  const PROJ_BOUNCE_VY = -6; // upward velocity on bounce
  const PROJ_MAX_BOUNCES = 4;

  s.projectiles = s.projectiles.filter((proj) => {
    // Apply gravity
    proj.vy = (proj.vy || 0) + PROJ_GRAVITY;
    proj.x += proj.vx;
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
          s.brokenBricks[key] = true;
          s.breakingBricks[key] = now;
          s.score += 50;
        }
        return false;
      } else if (side === 'bottom') {
        // Hit ceiling — just reverse
        proj.vy = Math.abs(proj.vy) * 0.5;
      }
    }

    // Check enemy collision
    for (const enemy of s.enemies) {
      if (!enemy.alive) continue;
      if (aabbOverlap(proj, enemy)) {
        enemy.alive = false;
        enemy.defeatedAt = now;
        s.score += 200;
        s.popups.push({ id: `pop-${now}-${enemy.id}`, x: enemy.x, y: enemy.y - 20, text: '200', createdAt: now });
        return false;
      }
    }

    return true;
  });
}

function updateEnemies(s, now) {
  for (const enemy of s.enemies) {
    if (!enemy.alive) continue;

    if (enemy.type === 'goomba') {
      // Patrol: walk left/right, reverse on wall or edge
      enemy.x += enemy.vx;

      // Tile collisions for goomba
      const rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
      const tiles = getSolidTilesInRect(rect);
      for (const tile of tiles) {
        const key = `${tile.row}-${tile.col}`;
        if (s.brokenBricks[key]) continue;
        const pen = aabbPenetration(rect, tile);
        if (pen) {
          const side = collisionSide(rect, tile, pen);
          if (side === 'left' || side === 'right') {
            enemy.vx = -enemy.vx;
            enemy.x += enemy.vx;
          }
        }
      }

      // Edge detection: check if there's ground ahead
      const checkX = enemy.vx > 0 ? enemy.x + enemy.width + 2 : enemy.x - 2;
      const checkY = enemy.y + enemy.height + 4;
      const col = Math.floor(checkX / TILE);
      const row = Math.floor(checkY / TILE);
      if (col >= 0 && col < LEVEL_COLS && row >= 0 && row < LEVEL_ROWS) {
        const aheadTile = MAP[row][col];
        const aheadKey = `${row}-${col}`;
        if (!isSolidTile(aheadTile) || s.brokenBricks[aheadKey]) {
          enemy.vx = -enemy.vx;
        }
      } else {
        enemy.vx = -enemy.vx;
      }
    } else if (enemy.type === 'flyer') {
      // Flyer: horizontal patrol + vertical bob
      enemy.x += enemy.vx;
      enemy.phase += ENEMY.FLYER.FREQUENCY;
      enemy.y = enemy.originY + Math.sin(enemy.phase) * ENEMY.FLYER.AMPLITUDE;

      // Reverse at edges or walls
      const rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
      const tiles = getSolidTilesInRect(rect);
      for (const tile of tiles) {
        const key = `${tile.row}-${tile.col}`;
        if (s.brokenBricks[key]) continue;
        if (aabbOverlap(rect, tile)) {
          enemy.vx = -enemy.vx;
          enemy.x += enemy.vx * 2;
          break;
        }
      }

      // Level edge bounce
      if (enemy.x < 0 || enemy.x + enemy.width > LEVEL_W) {
        enemy.vx = -enemy.vx;
      }
    }
  }

  // Remove defeated enemies after animation
  // (keep them for 500ms for the squish animation)
  s.enemies = s.enemies.filter(
    (e) => e.alive || now - e.defeatedAt < 500
  );
}

function checkPlayerEnemyCollisions(s, now) {
  const p = s.player;

  // Invincibility check
  if (p.invincibleUntil > now) return;

  for (const enemy of s.enemies) {
    if (!enemy.alive) continue;
    if (!aabbOverlap(p, enemy)) continue;

    const pen = aabbPenetration(p, enemy);
    const side = collisionSide(p, enemy, pen);

    if (side === 'top' && p.vy > 0) {
      // Stomp the enemy
      enemy.alive = false;
      enemy.defeatedAt = now;
      p.vy = PLAYER.JUMP_FORCE * 0.6; // bounce
      s.score += 100;
      s.popups.push({ id: `pop-${now}-${enemy.id}`, x: enemy.x, y: enemy.y - 20, text: '100', createdAt: now });
    } else {
      // Player takes damage
      if (p.big) {
        p.big = false;
        p.height = PLAYER.HEIGHT;
        // Adjust y so player doesn't clip into ground
        p.y += PLAYER.BIG_HEIGHT - PLAYER.HEIGHT;
        p.invincibleUntil = now + 1500;
      } else {
        handlePlayerDeath(s);
        return;
      }
    }
  }
}

function checkPlayerCoinCollisions(s, now) {
  const p = s.player;

  for (const coin of s.coins) {
    if (coin.collected) continue;
    if (aabbOverlap(p, coin)) {
      coin.collected = true;
      coin.collectedAt = now;
      s.score += COIN_VALUE;
      s.coinsCollected += 1;
    }
  }
}

function checkPlayerPowerupCollisions(s, now) {
  const p = s.player;

  for (const pu of s.powerups) {
    if (pu.collected) continue;

    // Powerup needs time to emerge
    if (now - pu.emergedAt < 600) {
      pu.active = false;
      continue;
    }
    pu.active = true;

    // Move powerup
    pu.x += pu.vx;
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
        pu.vx = -pu.vx;
      }
    }

    // Player pickup
    if (aabbOverlap(p, pu)) {
      pu.collected = true;
      if (pu.puType === 'fireflower') {
        // Fire flower: grant timed fire power only (no grow)
        p.firePowerUntil = now + PLAYER.FIRE_POWER_DURATION;
      } else {
        // Mushroom: grow big
        if (!p.big) {
          p.big = true;
          p.y -= (PLAYER.BIG_HEIGHT - PLAYER.HEIGHT);
          p.height = PLAYER.BIG_HEIGHT;
          p.growingUntil = now + 500;
        }
      }
      s.score += POWERUP_SCORE;
      s.popups.push({ id: `pop-${now}-pu`, x: pu.x, y: pu.y - 20, text: `${POWERUP_SCORE}`, createdAt: now });
    }
  }

  // Remove collected powerups after animation
  s.powerups = s.powerups.filter((pu) => !pu.collected || now - pu.emergedAt < 2000);
}

function checkFlagCollision(s, now) {
  if (s.flagReached) return;

  const p = s.player;
  const flag = {
    x: FLAG_POS.x - 10,
    y: FLAG_POS.y,
    width: 30,
    height: 288,
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

function updateFlagSequence(s, now) {
  const p = s.player;
  const elapsed = now - s.flagAnimStart;

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

function handlePlayerDeath(s) {
  s.lives -= 1;
  if (s.lives <= 0) {
    s.gameStatus = 'lost';
  } else {
    // Respawn
    const p = s.player;
    p.x = PLAYER_START.x;
    p.y = PLAYER_START.y;
    p.vx = 0;
    p.vy = 0;
    p.big = false;
    p.firePowerUntil = 0;
    p.doubleJumpUsed = false;
    p.height = PLAYER.HEIGHT;
    p.onGround = false;
    p.invincibleUntil = performance.now() + 2000;
  }
}
