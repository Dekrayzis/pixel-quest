// Player state
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1; // 1 = right, -1 = left
  big: boolean;
  firePowerUntil: number; // timestamp when fire power expires
  doubleJumpUsed: boolean; // true if mid-air jump already used
  invincibleUntil: number;
  growingUntil: number;
  state: 'idle' | 'walking' | 'jumping' | 'falling' | 'firing';
  lastFireTime: number;
}

// Enemy state
export interface Enemy {
  id: string;
  type: 'goomba' | 'flyer';
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  alive: boolean;
  defeatedAt: number;
  originY: number; // for flyer bobbing
  phase: number; // for flyer animation
}

// Coin state
export interface Coin {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  collectedAt: number;
}

// PowerUp state
export interface PowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  collected: boolean;
  emergedAt: number;
  puType: 'mushroom' | 'fireflower';
  vx?: number;
  vy?: number;
}

// Projectile state
export interface Projectile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 1 | -1;
  createdAt: number;
  vx?: number;
  vy?: number;
  bounces?: number;
}

// Popup for score/coin visuals
export interface Popup {
  id: string;
  x: number;
  y: number;
  text?: string;
  type?: 'coin' | 'score';
  createdAt: number;
}

// Main game state
export interface GameState {
  player: Player;
  enemies: Enemy[];
  coins: Coin[];
  powerups: PowerUp[];
  projectiles: Projectile[];
  popups: Popup[];
  
  // Tile state: track broken bricks and used item blocks
  brokenBricks: Record<string, boolean>;   // key: "row-col" -> true if broken
  usedBlocks: Record<string, boolean>;     // key: "row-col" -> true if used
  bumpedBlocks: Record<string, number>;    // key: "row-col" -> timestamp
  breakingBricks: Record<string, number>;  // key: "row-col" -> timestamp
  blockCoins: Record<string, number>;      // key: "row-col" -> remaining coin count
  
  score: number;
  lives: number;
  coinsCollected: number;
  gameStatus: 'start' | 'playing' | 'won' | 'lost';
  
  // Flag pole state
  flagReached: boolean;
  flagAnimStart: number;
  flagPhase: null | 'sliding' | 'grounded' | 'walking';
  flagSlideStartY: number;
  flagSlideProgress: number; // 0..1, driven by tick
  flagGroundedAt: number;
  
  now: number; // Current timestamp for the frame
}

// Tile collision info
export interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  type: number;
  row: number;
  col: number;
}

// Input state
export interface InputState {
  keys: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    space: boolean;
    fire: boolean;
  };
  justPressed: Set<string>;
}
