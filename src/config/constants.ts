/**
 * Central game constants — physics, sizes, gameplay tuning.
 * Adjust values here to tweak feel without hunting through components.
 */

// Tile / grid
export const TILE = 48;

// Viewport
export const VIEWPORT_W = 960;
export const VIEWPORT_H = 576; // 12 tiles tall

// Physics (pixels per frame at 60 fps)
export const GRAVITY = 0.65;
export const MAX_FALL_SPEED = 14;

// Player
export const PLAYER = {
  WIDTH: 40,
  HEIGHT: 48,
  BIG_HEIGHT: 80,
  SPEED: 4.5,
  JUMP_FORCE: -14,
  DOUBLE_JUMP_FORCE: -11,
  FIRE_COOLDOWN: 300, // ms
  FIRE_POWER_DURATION: 15000, // 15 seconds of fire power
} as const;

// Projectile
export const PROJECTILE = {
  WIDTH: 16,
  HEIGHT: 16,
  SPEED: 6,
  LIFETIME: 2000, // ms before auto-remove
} as const;

// Enemies
export const ENEMY = {
  GOOMBA: {
    WIDTH: 44,
    HEIGHT: 44,
    SPEED: 1.2,
  },
  FLYER: {
    WIDTH: 44,
    HEIGHT: 44,
    SPEED: 1.5,
    AMPLITUDE: 60, // vertical bob range
    FREQUENCY: 0.03, // bob speed
  },
  TURTLE: {
    WIDTH: 40,
    HEIGHT: 52,
    SHELL_HEIGHT: 32,
    SPEED: 1.0,
    SHELL_SPEED: 8,
    MAX_REBOUNDS: 3,
  },
} as const;

// Jump pad
export const JUMP_PAD_FORCE = -20; // stronger than normal jump (-14)

// Collectibles
export const COIN_VALUE = 100;
export const BLOCK_COIN_COUNT = 5; // coins per multi-coin block
export const LIVES_START = 3;
export const POWERUP_SCORE = 500;

// Flag pole
export const FLAG = {
  WIDTH: 12,
  HEIGHT: 288,
  BALL_SIZE: 20,
} as const;

// Z-index layers
export const Z = {
  BG: 0,
  TILES: 1,
  COLLECTIBLE: 2,
  ENEMY: 3,
  PROJECTILE: 4,
  PLAYER: 5,
  POWERUP: 6,
  HUD: 10,
  OVERLAY: 20,
} as const;
