import {
  TILE,
  GRAVITY, MAX_FALL_SPEED,
  PLAYER, PROJECTILE, ENEMY,
  COIN_VALUE, BLOCK_COIN_COUNT, LIVES_START, POWERUP_SCORE,
  JUMP_PAD_FORCE,
} from '../config/constants';
import { getActiveLevel } from '../data/activeLevel';
import { aabbOverlap, aabbPenetration, collisionSide } from '../utils/collision';
import { getSolidTilesInRect, isSolidTile } from '../utils/physics';
import type { GameKeys } from './useInput';

function getZoneDims(zoneId: string): { w: number; h: number; cols: number; rows: number; map: number[][] } {
  const level = getActiveLevel();
  const zone = level.zones[zoneId] ?? level.zones.overworld;
  const rows = zone.map.length;
  const cols = zone.map[0]?.length ?? 0;
  return { map: zone.map, cols, rows, w: cols * TILE, h: rows * TILE };
}

/* ──────────────────────────────────────────────────────
   Initial state factory
   ────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createInitialState(): any {
  const level = getActiveLevel();

  // Build coins per zone
  const coinsByZone: Record<string, any[]> = {};
  for (const zoneId of Object.keys(level.zones)) {
    const z = level.zones[zoneId];
    coinsByZone[zoneId] = z.coins.map((c, i) => ({
      id: `${zoneId}-coin-${i}`,
      x: c.x,
      y: c.y,
      width: 24,
      height: 28,
      collected: false,
      collectedAt: 0,
    }));
  }

  // Build enemies from all zones
  const enemies = Object.keys(level.zones).flatMap((zoneId) => {
    const z = level.zones[zoneId];
    return z.enemies.map((e, i) => {
      const dims = e.type === 'turtle' ? ENEMY.TURTLE
        : e.type === 'goomba' ? ENEMY.GOOMBA : ENEMY.FLYER;
      const spd = e.type === 'turtle' ? -ENEMY.TURTLE.SPEED
        : e.type === 'goomba' ? -ENEMY.GOOMBA.SPEED : ENEMY.FLYER.SPEED;
      return {
        id: `${zoneId}-enemy-${i}`,
        type: e.type,
        x: e.x,
        y: e.y,
        width: dims.WIDTH,
        height: dims.HEIGHT,
        vx: spd,
        vy: 0,
        alive: true,
        defeatedAt: 0,
        originY: e.y,
        phase: Math.random() * Math.PI * 2,
        zone: zoneId,
        shellState: null as string | null,
        shellRebounds: 0,
      };
    });
  });

  return {
    player: {
      x: level.playerStart.x,
      y: level.playerStart.y,
      width: PLAYER.WIDTH,
      height: PLAYER.HEIGHT,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      big: false,
      firePowerUntil: 0,
      doubleJumpUsed: false,
      invincibleUntil: 0,
      growingUntil: 0,
      state: 'idle',
      lastFireTime: 0,
      jumpStartTime: 0,
    },
    enemies,
    coinsByZone,
    projectiles: [],
    powerups: [],
    brokenBricks: {} as Record<string, boolean>,
    usedBlocks: {} as Record<string, boolean>,
    blockCoins: {} as Record<string, number>,
    bumpedBlocks: {} as Record<string, number>,
    breakingBricks: {} as Record<string, number>,
    popups: [] as any[],
    score: 0,
    lives: LIVES_START,
    coinsCollected: 0,
    gameStatus: 'start' as string,
    flagReached: false,
    flagAnimStart: 0,
    flagPhase: null as string | null,
    flagSlideStartY: 0,
    flagSlideProgress: 0,
    flagGroundedAt: 0,
    now: 0,
    currentZone: 'overworld' as string,
    warpState: 'none' as string,
    warpStartTime: 0,
    warpPipeId: null as string | null,
  };
}

/* ──────────────────────────────────────────────────────
   Tick — called once per frame from the Game component.
   Mutates the state object in-place.
   ────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tickGameState(s: any, inputKeys: React.MutableRefObject<GameKeys>, consumeJustPressed: (action: string) => boolean): void {
  const now = performance.now();
  s.now = now;
  const keys = inputKeys.current;
  const zone: string = s.currentZone;

  // ── Warp pipe animation (overrides everything) ──
  if (s.warpState !== 'none') {
    updateWarpSequence(s, now);
    return;
  }

  // ── Flag pole sequence (overrides normal movement) ──
  const p = s.player;

  if (s.flagReached) {
    updateFlagSequence(s, now);
    // Still update popups/bricks during flag sequence
    s.popups = s.popups.filter((pop: any) => now - pop.createdAt < 1000);
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
      p.vy = p.big ? PLAYER.JUMP_FORCE : PLAYER.JUMP_FORCE * 0.85; // small Mario jumps lower
      p.onGround = false;
      p.doubleJumpUsed = false;
      p.jumpStartTime = now;
    } else if (!p.doubleJumpUsed && now - (p.jumpStartTime || 0) > 150) {
      p.vy = p.big ? PLAYER.DOUBLE_JUMP_FORCE : PLAYER.DOUBLE_JUMP_FORCE * 0.85;
      p.vx *= 0.5; // reduce horizontal control mid-air
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
  resolvePlayerTileCollisionsX(s, zone);

  // ── Move Y then resolve ─────────────────────────
  p.y += p.vy;
  resolvePlayerTileCollisionsY(s, zone);

  // Clamp to level bounds (zone-aware)
  const { w: zoneW, h: zoneH } = getZoneDims(zone);
  if (p.x < 0) p.x = 0;
  if (p.x + p.width > zoneW) p.x = zoneW - p.width;

  // Fell into pit
  if (p.y > zoneH + 50) {
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
  updateProjectiles(s, now, zone);

  // ── Update enemies ──────────────────────────────
  updateEnemies(s, now, zone);

  // ── Player vs enemies ───────────────────────────
  checkPlayerEnemyCollisions(s, now);

  // ── Player vs coins ─────────────────────────────
  checkPlayerCoinCollisions(s, now);

  // ── Player vs powerups ──────────────────────────
  checkPlayerPowerupCollisions(s, now, zone);

  // ── Player vs flag (overworld only) ───────────────
  if (zone === 'overworld') checkFlagCollision(s, now);

  // ── Warp pipe detection ───────────────────────────
  checkWarpPipeEntry(s, keys, consumeJustPressed, now);

  // ── Cleanup dead popups ─────────────────────────
  s.popups = s.popups.filter((pop: any) => now - pop.createdAt < 1000);

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

function resolvePlayerTileCollisionsX(s: any, zone = 'overworld'): void {
  const p = s.player;
  const tiles = getSolidTilesInRect(p, zone);

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

function resolvePlayerTileCollisionsY(s: any, zone = 'overworld'): void {
  const p = s.player;
  const tiles = getSolidTilesInRect(p, zone);
  p.onGround = false;

  for (const tile of tiles) {
    const key = `${tile.row}-${tile.col}`;
    if (s.brokenBricks[key]) continue;

    const pen = aabbPenetration(p, tile);
    if (!pen) continue;

    const side = collisionSide(p, tile, pen);
    if (side === 'top' && p.vy >= 0) {
      // Landing on top of a tile (only when falling or stationary, not when jumping up)
      p.y = tile.y - p.height;
      if (tile.type === 9) {
        // Jump pad: bounce the player upward
        p.vy = JUMP_PAD_FORCE;
        p.onGround = false;
        p.doubleJumpUsed = false;
      } else {
        p.vy = 0;
        p.onGround = true;
      }
    } else if (side === 'bottom' && p.vy < 0) {
      // Hit head on tile from below (only when moving upward)
      p.y = tile.y + tile.height;
      p.vy = 0;
      handleBlockHitFromBelow(s, tile, key);
    }
  }

  // Extra ground probe: check 2px below feet for a solid tile.
  // This ensures onGround is reliably true even when perfectly flush with a tile.
  if (!p.onGround && p.vy >= 0) {
    const probeY = p.y + p.height + 2;
    const leftCol = Math.floor(p.x / TILE);
    const rightCol = Math.floor((p.x + p.width - 1) / TILE);
    const row = Math.floor(probeY / TILE);
    const { map, cols, rows } = getZoneDims(zone);
    if (row >= 0 && row < rows) {
      for (let c = leftCol; c <= rightCol; c++) {
        if (c >= 0 && c < cols && isSolidTile(map[row][c]) && !s.brokenBricks[`${row}-${c}`]) {
          // Feet are within 2px of solid ground
          const tileTop = row * TILE;
          if (Math.abs((p.y + p.height) - tileTop) <= 2) {
            p.y = tileTop - p.height;
            p.vy = 0;
            p.onGround = true;
            break;
          }
        }
      }
    }
  }
}

function handleBlockHitFromBelow(s: any, tile: any, key: string): void {
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

function updateProjectiles(s: any, now: number, zone = 'overworld'): void {
  const PROJ_GRAVITY = 0.5;
  const PROJ_BOUNCE_VY = -6; // upward velocity on bounce
  const PROJ_MAX_BOUNCES = 4;

  s.projectiles = s.projectiles.filter((proj: any) => {
    // Apply gravity
    proj.vy = (proj.vy || 0) + PROJ_GRAVITY;
    proj.x += proj.vx;
    proj.y += proj.vy;

    // Check lifetime
    if (now - proj.createdAt > PROJECTILE.LIFETIME) return false;

    // Fell off the level
    const { h: projLevelH } = getZoneDims(zone);
    if (proj.y > projLevelH + 50) return false;

    // Tile collisions — bounce off ground, die on walls
    const tiles = getSolidTilesInRect(proj, zone);
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
        if (enemy.type === 'turtle' && !enemy.shellState) {
          // Fireball converts walking turtle to idle shell
          enemy.shellState = 'idle';
          enemy.vx = 0;
          enemy.height = ENEMY.TURTLE.SHELL_HEIGHT;
          enemy.y += ENEMY.TURTLE.HEIGHT - ENEMY.TURTLE.SHELL_HEIGHT;
        } else {
          enemy.alive = false;
          enemy.defeatedAt = now;
        }
        s.score += 200;
        s.popups.push({ id: `pop-${now}-${enemy.id}`, x: enemy.x, y: enemy.y - 20, text: '200', createdAt: now });
        return false;
      }
    }

    return true;
  });
}

function updateEnemies(s: any, now: number, zone = 'overworld'): void {
  for (const enemy of s.enemies) {
    if (!enemy.alive) continue;
    if ((enemy.zone || 'overworld') !== zone) continue;

    if (enemy.type === 'goomba') {
      // Patrol: walk left/right, reverse on wall or edge
      enemy.x += enemy.vx;

      // Tile collisions for goomba
      const rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
      const tiles = getSolidTilesInRect(rect, zone);
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
      const { map: gMap, cols: gCols, rows: gRows } = getZoneDims(zone);
      if (col >= 0 && col < gCols && row >= 0 && row < gRows) {
        const aheadTile = gMap[row][col];
        const aheadKey = `${row}-${col}`;
        if (!isSolidTile(aheadTile) || s.brokenBricks[aheadKey]) {
          enemy.vx = -enemy.vx;
        }
      } else {
        enemy.vx = -enemy.vx;
      }
    } else if (enemy.type === 'turtle') {
      if (!enemy.shellState) {
        // Walking patrol — same pattern as goomba (no gravity, stays on spawn Y)
        enemy.x += enemy.vx;

        // Tile collisions — horizontal only (same as goomba)
        const tRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        const tTiles = getSolidTilesInRect(tRect, zone);
        for (const tile of tTiles) {
          const key = `${tile.row}-${tile.col}`;
          if (s.brokenBricks[key]) continue;
          const pen = aabbPenetration(tRect, tile);
          if (pen) {
            const side = collisionSide(tRect, tile, pen);
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
        const { map: tMap, cols: tCols, rows: tRows } = getZoneDims(zone);
        if (col >= 0 && col < tCols && row >= 0 && row < tRows) {
          const aheadTile = tMap[row][col];
          const aheadKey = `${row}-${col}`;
          if (!isSolidTile(aheadTile) || s.brokenBricks[aheadKey]) {
            enemy.vx = -enemy.vx;
          }
        } else {
          enemy.vx = -enemy.vx;
        }
      } else if (enemy.shellState === 'idle') {
        // Shell sitting still — apply gravity only
        enemy.vy = Math.min((enemy.vy || 0) + GRAVITY, MAX_FALL_SPEED);
        enemy.y += enemy.vy;
        const rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        const tiles = getSolidTilesInRect(rect, zone);
        for (const tile of tiles) {
          const key = `${tile.row}-${tile.col}`;
          if (s.brokenBricks[key]) continue;
          const pen = aabbPenetration(rect, tile);
          if (pen) {
            const side = collisionSide(rect, tile, pen);
            if (side === 'top') {
              enemy.y = tile.y - enemy.height;
              enemy.vy = 0;
            }
          }
        }
      } else if (enemy.shellState === 'sliding') {
        // Shell sliding fast — rebounds off walls up to MAX_REBOUNDS
        enemy.x += enemy.vx;

        // Gravity
        enemy.vy = Math.min((enemy.vy || 0) + GRAVITY, MAX_FALL_SPEED);
        enemy.y += enemy.vy;

        // Resolve ground collisions first (top-side only)
        const sRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        const sTiles = getSolidTilesInRect(sRect, zone);
        for (const tile of sTiles) {
          const key = `${tile.row}-${tile.col}`;
          if (s.brokenBricks[key]) continue;
          const pen = aabbPenetration({ x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }, tile);
          if (pen) {
            const side = collisionSide({ x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }, tile, pen);
            if (side === 'top') {
              enemy.y = tile.y - enemy.height;
              enemy.vy = 0;
            }
          }
        }

        // Now check wall collisions — only count ONE rebound per frame
        let reboundedThisFrame = false;
        const wTiles = getSolidTilesInRect({ x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }, zone);
        for (const tile of wTiles) {
          if (reboundedThisFrame) break;
          const key = `${tile.row}-${tile.col}`;
          if (s.brokenBricks[key]) continue;
          const pen = aabbPenetration({ x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }, tile);
          if (pen) {
            const side = collisionSide({ x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }, tile, pen);
            if (side === 'left' || side === 'right') {
              enemy.vx = -enemy.vx;
              enemy.x += enemy.vx;
              enemy.shellRebounds += 1;
              reboundedThisFrame = true;
              if (enemy.shellRebounds >= ENEMY.TURTLE.MAX_REBOUNDS) {
                enemy.alive = false;
                enemy.defeatedAt = now;
                s.score += 100;
                s.popups.push({ id: `pop-${now}-${enemy.id}`, x: enemy.x, y: enemy.y - 20, text: '100', createdAt: now });
              }
            }
          }
        }

        // Level edge rebound (only if no tile rebound this frame)
        if (!reboundedThisFrame) {
          const { w: eLevelW } = getZoneDims(zone);
          if (enemy.x < 0 || enemy.x + enemy.width > eLevelW) {
            enemy.vx = -enemy.vx;
            enemy.shellRebounds += 1;
            if (enemy.shellRebounds >= ENEMY.TURTLE.MAX_REBOUNDS) {
              enemy.alive = false;
              enemy.defeatedAt = now;
            }
          }
        }

        // Sliding shell kills other enemies it hits
        const killRect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        for (const other of s.enemies) {
          if (other === enemy || !other.alive) continue;
          if ((other.zone || 'overworld') !== zone) continue;
          if (aabbOverlap(killRect, other)) {
            other.alive = false;
            other.defeatedAt = now;
            s.score += 100;
            s.popups.push({ id: `pop-${now}-${other.id}`, x: other.x, y: other.y - 20, text: '100', createdAt: now });
          }
        }
      }
    } else if (enemy.type === 'flyer') {
      // Flyer: horizontal patrol + vertical bob
      enemy.x += enemy.vx;
      enemy.phase += ENEMY.FLYER.FREQUENCY;
      enemy.y = enemy.originY + Math.sin(enemy.phase) * ENEMY.FLYER.AMPLITUDE;

      // Reverse at edges or walls
      const rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
      const tiles = getSolidTilesInRect(rect, zone);
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
      const { w: fLevelW } = getZoneDims(zone);
      if (enemy.x < 0 || enemy.x + enemy.width > fLevelW) {
        enemy.vx = -enemy.vx;
      }
    }
  }

  // Remove defeated enemies after animation
  // (keep them for 500ms for the squish animation)
  s.enemies = s.enemies.filter(
    (e: any) => e.alive || now - e.defeatedAt < 500
  );
}

function checkPlayerEnemyCollisions(s: any, now: number): void {
  const p = s.player;
  const zone = s.currentZone;

  // Invincibility check
  if (p.invincibleUntil > now) return;

  for (const enemy of s.enemies) {
    if (!enemy.alive) continue;
    if ((enemy.zone || 'overworld') !== zone) continue;
    if (!aabbOverlap(p, enemy)) continue;

    const pen = aabbPenetration(p, enemy);
    if (!pen) continue;
    const side = collisionSide(p, enemy, pen);

    // ── Turtle-specific collision logic ──
    if (enemy.type === 'turtle') {
      if (side === 'top' && p.vy > 0) {
        p.vy = PLAYER.JUMP_FORCE * 0.6; // bounce

        if (!enemy.shellState) {
          // Stomp walking turtle → becomes sliding shell
          enemy.shellState = 'sliding';
          enemy.shellRebounds = 0;
          enemy.height = ENEMY.TURTLE.SHELL_HEIGHT;
          enemy.y += ENEMY.TURTLE.HEIGHT - ENEMY.TURTLE.SHELL_HEIGHT;
          // Kick in direction player is facing
          enemy.vx = p.facing * ENEMY.TURTLE.SHELL_SPEED;
          s.score += 100;
          s.popups.push({ id: `pop-${now}-${enemy.id}-stomp`, x: enemy.x, y: enemy.y - 20, text: '100', createdAt: now });
          p.invincibleUntil = Math.max(p.invincibleUntil, now + 200);
        } else if (enemy.shellState === 'sliding') {
          // Stomp a sliding shell → destroy it
          enemy.alive = false;
          enemy.defeatedAt = now;
          s.score += 100;
          s.popups.push({ id: `pop-${now}-${enemy.id}-kill`, x: enemy.x, y: enemy.y - 20, text: '100', createdAt: now });
        }
      } else {
        // Side collision with walking turtle or sliding shell → damage player
        if (p.big) {
          p.big = false;
          p.height = PLAYER.HEIGHT;
          p.y += PLAYER.BIG_HEIGHT - PLAYER.HEIGHT;
          p.invincibleUntil = now + 1500;
        } else {
          handlePlayerDeath(s);
          return;
        }
      }
      continue;
    }

    // ── Standard enemy collision (goomba, flyer) ──
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

function checkPlayerCoinCollisions(s: any, now: number): void {
  const p = s.player;
  const coinList = s.coinsByZone?.[s.currentZone] ?? [];

  for (const coin of coinList) {
    if (coin.collected) continue;
    if (aabbOverlap(p, coin)) {
      coin.collected = true;
      coin.collectedAt = now;
      s.score += COIN_VALUE;
      s.coinsCollected += 1;
    }
  }
}

function checkPlayerPowerupCollisions(s: any, now: number, zone = 'overworld'): void {
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
    const tiles = getSolidTilesInRect(pu, zone);
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
  s.powerups = s.powerups.filter((pu: any) => !pu.collected || now - pu.emergedAt < 2000);
}

function checkFlagCollision(s: any, now: number): void {
  if (s.flagReached) return;

  const level = getActiveLevel();
  const flagPos = level.flagPos;
  const p = s.player;
  const flag = {
    x: flagPos.x - 10,
    y: flagPos.y,
    width: 30,
    height: 288,
  };

  if (aabbOverlap(p, flag)) {
    s.flagReached = true;
    s.flagAnimStart = now;
    s.flagPhase = 'sliding';
    s.flagSlideStartY = p.y;
    s.score += 1000;
    p.x = flagPos.x + 30 - p.width;
    p.vx = 0;
    p.vy = 0;
    p.facing = 1;
    p.state = 'idle';
  }
}

const FLAG_GROUND_Y = 10 * TILE;
const FLAG_SLIDE_DURATION = 1000;
const FLAG_PAUSE_DURATION = 400;

function updateFlagSequence(s: any, now: number): void {
  const level = getActiveLevel();
  const flagPos = level.flagPos;
  const FLAG_WALK_TARGET_X = flagPos.x + 4 * TILE;
  const p = s.player;
  const elapsed = now - s.flagAnimStart;

  if (s.flagPhase === 'sliding') {
    const slideProgress = Math.min(elapsed / FLAG_SLIDE_DURATION, 1);
    s.flagSlideProgress = slideProgress;
    const targetY = FLAG_GROUND_Y - p.height;
    p.y = s.flagSlideStartY + (targetY - s.flagSlideStartY) * slideProgress;
    p.x = flagPos.x + 30 - p.width;
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
    p.vx = 0;
    p.state = 'idle';
    p.facing = 1;

    if (now - s.flagGroundedAt > FLAG_PAUSE_DURATION) {
      s.flagPhase = 'walking';
      p.x = flagPos.x + 10;
      p.facing = 1;
    }
  } else if (s.flagPhase === 'walking') {
    p.vx = PLAYER.SPEED * 0.8;
    p.x += p.vx;
    p.state = 'walking';
    p.facing = 1;

    p.vy = Math.min(p.vy + GRAVITY, MAX_FALL_SPEED);
    p.y += p.vy;
    resolvePlayerTileCollisionsY(s, s.currentZone);

    if (p.x >= FLAG_WALK_TARGET_X) {
      s.gameStatus = 'won';
    }
  }
}

function handlePlayerDeath(s: any): void {
  s.lives -= 1;
  if (s.lives <= 0) {
    s.gameStatus = 'lost';
  } else {
    // Respawn in overworld
    s.currentZone = 'overworld';
    s.warpState = 'none';
    const p = s.player;
    const level = getActiveLevel();
    p.x = level.playerStart.x;
    p.y = level.playerStart.y;
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

/* ══════════════════════════════════════════════════════
   Warp pipe logic
   ══════════════════════════════════════════════════════ */

const WARP_SINK_DURATION = 600;   // ms to sink into pipe
const WARP_TRANSITION_DURATION = 400; // ms black screen
const WARP_EMERGE_DURATION = 600; // ms to rise out of pipe

/**
 * Check if the player is standing on a warp pipe-top and pressing down.
 * If so, start the sinking animation.
 */
function checkWarpPipeEntry(s: any, keys: GameKeys, _consumeJustPressed: (action: string) => boolean, now: number): void {
  if (!keys.down) return;
  if (!s.player.onGround) return;

  const level = getActiveLevel();
  const p = s.player;
  const zone = s.currentZone;

  const feetRow = Math.floor((p.y + p.height) / TILE);
  const playerCenterCol = Math.floor((p.x + p.width / 2) / TILE);

  const { map: zMap, cols: zCols, rows: zRows } = getZoneDims(zone);

  if (feetRow < 0 || feetRow >= zRows || playerCenterCol < 0 || playerCenterCol >= zCols) return;
  const tileType = zMap[feetRow][playerCenterCol];
  if (tileType !== 8) return;

  let pipeLeftCol = playerCenterCol;
  if (playerCenterCol > 0 && zMap[feetRow][playerCenterCol - 1] === 8) {
    pipeLeftCol = playerCenterCol - 1;
  }

  for (const wp of level.warpPipes) {
    if (wp.entryZone === zone && wp.entryCol === pipeLeftCol && wp.entryRow === feetRow) {
      s.warpState = 'sinking';
      s.warpStartTime = now;
      s.warpPipeId = wp.id;
      p.vx = 0;
      p.vy = 0;
      p.state = 'idle';
      p.x = pipeLeftCol * TILE + (TILE - p.width / 2) / 2;
      return;
    }
  }
}

/**
 * Handle the warp pipe animation sequence:
 * 1. sinking — player slides down into the pipe
 * 2. transitioning — brief black-screen pause, switch zone
 * 3. emerging — player rises out of exit pipe
 */
function updateWarpSequence(s: any, now: number): void {
  const level = getActiveLevel();
  const elapsed = now - s.warpStartTime;
  const p = s.player;
  const warp = level.warpPipes.find((wp: any) => wp.id === s.warpPipeId);
  if (!warp) { s.warpState = 'none'; return; }

  if (s.warpState === 'sinking') {
    const progress = Math.min(elapsed / WARP_SINK_DURATION, 1);
    p.y += 1.5;
    p.vx = 0;
    p.vy = 0;
    p.state = 'idle';

    if (progress >= 1) {
      s.warpState = 'transitioning';
      s.warpStartTime = now;
    }
  } else if (s.warpState === 'transitioning') {
    if (elapsed >= WARP_TRANSITION_DURATION) {
      s.currentZone = warp.exitZone;
      p.x = warp.exitPlayerX;
      if (warp.emergeDirection === 'down') {
        p.y = warp.exitPlayerY - TILE * 1.5;
      } else {
        p.y = warp.exitPlayerY + TILE * 1.5;
      }
      p.vx = 0;
      p.vy = 0;

      s.warpState = 'emerging';
      s.warpStartTime = now;
    }
  } else if (s.warpState === 'emerging') {
    const progress = Math.min(elapsed / WARP_EMERGE_DURATION, 1);
    const targetY = warp.exitPlayerY;
    const startY = warp.emergeDirection === 'down'
      ? targetY - TILE * 1.5
      : targetY + TILE * 1.5;
    p.y = startY + (targetY - startY) * progress;
    p.vx = 0;
    p.vy = 0;
    p.state = 'idle';

    if (progress >= 1) {
      s.warpState = 'none';
      p.y = targetY;
      p.onGround = warp.emergeDirection === 'up';
    }
  }
}
