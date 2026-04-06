# Pixel Quest — Portfolio Report

## Project Overview

**Pixel Quest** is a browser-based 2D platformer inspired by Super Mario Bros, built entirely with React, TypeScript, and pure CSS. Every character, enemy, tile, and visual effect is rendered using CSS — no image assets, sprite sheets, or canvas drawing. The game runs at 60fps via `requestAnimationFrame` and features a complete gameplay loop with multiple zones, enemies, power-ups, and a flag pole win sequence.

**Live tech stack:** React 18 · TypeScript · Vite · SCSS

---

## Table of Contents

1. [Architecture & Design](#architecture--design)
2. [Game Loop & State Management](#game-loop--state-management)
3. [Physics & Collision System](#physics--collision-system)
4. [Tile-Based Level Design](#tile-based-level-design)
5. [Entity System](#entity-system)
6. [Zone System & Warp Pipes](#zone-system--warp-pipes)
7. [Pure CSS Pixel Art](#pure-css-pixel-art)
8. [Performance Considerations](#performance-considerations)
9. [Key Technical Decisions](#key-technical-decisions)
10. [Feature Summary](#feature-summary)
11. [Project Statistics](#project-statistics)

---

## Architecture & Design

The project follows a clear separation of concerns:

```
src/
├── components/          # Presentational React components (10 files)
│   ├── Game.tsx         # Root game component — loop, camera, rendering
│   ├── Player.tsx       # Mario sprite (CSS pixel art)
│   ├── Enemy.tsx        # Goomba, Flyer, Turtle rendering
│   ├── Platform.tsx     # Tile renderer (viewport-culled)
│   ├── Coin.tsx         # Coin collectible
│   ├── PowerUp.tsx      # Mushroom / Fire Flower
│   ├── Projectile.tsx   # Fireball projectile
│   ├── FlagPole.tsx     # End-of-level flag pole
│   ├── HUD.tsx          # Score, lives, coin count overlay
│   └── GameOverScreen.tsx  # Start / Win / Game Over overlays
│
├── config/
│   └── constants.ts     # All tunable physics, sizes, and timing values
│
├── data/
│   └── level1.ts        # Level maps (overworld + underground), spawns, warp pipes
│
├── hooks/
│   ├── useGameState.ts  # Core game logic (~1,000 lines) — the game engine
│   └── useInput.ts      # Keyboard input with buffered jump detection
│
├── styles/              # 16 SCSS files — variables, mixins, animations, components
│
└── utils/
    ├── collision.ts     # AABB overlap, penetration, and side detection
    └── physics.ts       # Zone-aware tile lookups and solid tile queries
```

### Design Principles

- **Data-driven levels** — Maps are 2D number arrays; entities are coordinate lists. Adding content means editing data, not code.
- **Config-driven tuning** — All physics values, sizes, and timing constants live in one file (`constants.ts`), enabling rapid iteration.
- **Mutable state with React rendering** — Game state is a mutable object ref updated 60 times per second. React only re-renders via a `useReducer` force-render trigger, avoiding unnecessary virtual DOM diffing.
- **Zero external game libraries** — No Phaser, PixiJS, or game engine. Built from scratch using React, CSS, and raw physics math.

---

## Game Loop & State Management

The game loop is driven by `requestAnimationFrame` inside `Game.tsx`. Each frame:

1. **Input is read** from a keyboard ref (no re-renders on key press)
2. **`tickGameState()`** is called with the current keys and timestamp
3. The tick function mutates the state object in place, handling:
   - Warp pipe animation sequences
   - Flag pole win sequence
   - Player movement, gravity, and tile collisions (X then Y pass)
   - Jump and double-jump mechanics with buffered input
   - Fireball spawning, movement, and enemy collision
   - Enemy AI (patrol, bob, shell sliding)
   - Coin and power-up collection
   - Block interactions (bump, break, multi-coin dispense)
   - Player death and respawn
4. A **force-render** is triggered to update the React tree

### Input Handling

`useInput.ts` implements a **buffered jump system** — jump presses are timestamped, and the jump is consumed if pressed within 150ms of landing. This makes the controls feel responsive even if the player presses jump slightly before touching the ground. The `down` key is used for warp pipe entry.

---

## Physics & Collision System

### AABB Collision

All entities are axis-aligned bounding boxes (`{ x, y, width, height }`). The collision system (`collision.ts`) provides three functions:

| Function | Purpose |
|----------|---------|
| `aabbOverlap` | Boolean overlap test between two rectangles |
| `aabbPenetration` | Returns the overlap vector (how far A penetrates B) |
| `collisionSide` | Determines which side of B was hit (top/bottom/left/right) using penetration depth and center comparison |

### Tile Collision Resolution

Player-tile collisions are resolved in **two separate passes** — first horizontal (X), then vertical (Y). This prevents corner-case bugs where diagonal movement causes the player to clip through tiles or get stuck on edges.

Each pass:
1. Queries all solid tiles overlapping the player's bounding box via `getSolidTilesInRect()`
2. Computes penetration and collision side
3. Pushes the player out of the tile and zeroes the relevant velocity component
4. Handles special tile interactions (brick breaking, item dispensing, block bumping)

### Gravity

Gravity is a constant acceleration (`0.65 px/frame²`) applied each frame, capped at a terminal velocity of `14 px/frame`. This applies to the player, enemies (goombas, turtles), projectiles, and power-ups.

---

## Tile-Based Level Design

Levels are defined as 2D arrays of integers, where each number represents a tile type:

| Code | Tile | Behavior |
|------|------|----------|
| 0 | Empty | Air — no collision |
| 1 | Ground | Solid brown terrain |
| 2 | Brick | Breakable when hit from below (if player is big) |
| 3 | ? Block (coin) | Dispenses a coin when hit from below |
| 4 | ? Block (powerup) | Dispenses a mushroom or fire flower |
| 5 | Solid block | Indestructible blue block |
| 6 | Multi-coin block | Dispenses up to 5 coins, then shatters |
| 7 | Pipe body | Solid green pipe segment |
| 8 | Pipe top | Solid; can be a warp pipe entry point |

The overworld is **80×12 tiles** (3,840×576 pixels). The underground is **20×12 tiles** (960×576 pixels). Both use the same tile legend, and the physics system dynamically selects the correct map based on the current zone.

### Viewport Culling

`Platform.tsx` only renders tiles within the camera viewport plus a 2-tile buffer. For an 80-column level, this means rendering ~22 columns instead of 80 at any given time — a significant reduction in DOM nodes.

---

## Entity System

### Player

- **Movement:** Horizontal velocity with instant direction change, no acceleration ramp
- **Jump:** Fixed upward impulse (`-14 px/frame`); double jump available mid-air (`-11 px/frame`)
- **Power-ups:** Mushroom makes the player big (can break bricks); Fire Flower grants timed fireball ability (15 seconds) with a visual flash warning before expiration
- **Invincibility:** Brief invincibility after taking damage, with a flashing visual effect
- **Growth animation:** Visual scale pulse when collecting a mushroom

### Enemies

| Type | AI | Defeat |
|------|-----|--------|
| **Goomba** | Walks left/right, reverses at walls and ledge edges | Stomp or fireball |
| **Flyer** | Horizontal patrol with sinusoidal vertical bobbing | Stomp or fireball |
| **Turtle** | Ground patrol with gravity and edge detection | Stomp converts to sliding shell; shell rebounds off walls (max 3), kills other enemies on contact, damages player on side contact; stomp sliding shell to destroy; fireball converts to shell |

Each enemy has a **zone tag** (`'overworld'` or `'underground'`), so enemy updates and collisions are scoped to the player's current zone.

### Projectiles (Fireballs)

- Spawned with horizontal velocity in the player's facing direction
- Affected by gravity; bounce off ground tiles
- Destroyed on wall collision or after 2 seconds
- Kill enemies on contact (turtles are converted to shells instead)

### Power-ups

- Emerge from ? blocks with a rising animation
- Move horizontally and are affected by gravity
- Reverse direction on wall collision
- Mushroom: makes player big; Fire Flower: grants timed fireball ability

---

## Zone System & Warp Pipes

The game supports multiple zones with seamless transitions:

### Zone Architecture

- Each zone has its own **tile map**, **dimensions**, and **level bounds**
- `physics.ts` accepts a `zone` parameter, dynamically selecting the correct map data
- All physics calls (`getSolidTilesInRect`, `getTileAt`) throughout the game engine pass the current zone
- Camera bounds are zone-aware, clamping to the correct level width
- The background changes from a sky gradient (overworld) to a dark gradient (underground)

### Warp Pipe Configuration

Warp pipes are defined declaratively in `level1.ts`:

```typescript
interface WarpPipe {
  id: string;
  entryZone: string;      // zone where player enters
  entryCol: number;        // left column of the 2-wide pipe-top
  entryRow: number;        // row of the pipe-top tile
  exitZone: string;        // destination zone
  exitPlayerX: number;     // pixel X where player appears
  exitPlayerY: number;     // pixel Y where player appears
  emergeDirection: 'up' | 'down';  // emerge from below or drop from above
}
```

### Warp Animation Sequence

1. **Detection:** Player presses Down while standing on a pipe-top tile that matches a warp pipe entry
2. **Sinking (600ms):** Player slides downward behind the pipe (z-index drops below tiles)
3. **Transition (400ms):** Black screen overlay; zone switch occurs; underground entities spawn on first visit
4. **Emerging (600ms):** Player rises up from the exit pipe (or drops down from a ceiling pipe, based on `emergeDirection`)

The underground features a ceiling-mounted entry pipe (player drops down from above) and a floor-mounted exit pipe (player rises up), creating an authentic warp experience.

---

## Pure CSS Pixel Art

Every visual element is built with CSS:

- **Player (Mario):** 10+ nested `div` elements for cap, hair, face, eyes, nose, sideburn, shirt, overalls, button, and shoes. Walking animation uses `skewX` transforms; idle uses a subtle breathing `scaleY` animation.
- **Enemies:** Each enemy type has unique CSS-crafted body parts — goombas have a rounded head and feet, flyers have a body core with animated wings, turtles have a shell with pattern lines, head, eye, and feet.
- **Tiles:** Ground uses a brown gradient with pixel-border mixin; bricks use a red/highlight pattern; ? blocks use yellow with a bobbing question mark; pipes use a green gradient with a distinct top section.
- **Animations:** 20+ `@keyframes` animations for coin spin, block bump, brick fragment explosion, power-up emerge, enemy waddle/squish, shell spin, fireball spin, flag wave, player walk/grow/hurt, and more.

### SCSS Architecture

- **`_variables.scss`** — 40+ color variables, spacing tokens, z-index layers
- **`_mixins.scss`** — Reusable mixins for absolute positioning, pixel borders, and entity styling
- **`_animations.scss`** — All keyframe animations in one file
- **Component SCSS files** — Each component has a dedicated stylesheet

---

## Performance Considerations

1. **Mutable state:** Game state is a plain object mutated in place each frame, avoiding React's immutable state overhead. Only one `forceRender()` call per frame triggers the React tree update.
2. **Viewport culling:** Only tiles and entities within the camera viewport (plus a small buffer) are rendered to the DOM.
3. **Ref-based input:** Keyboard state is stored in a `useRef`, so key presses never trigger React re-renders.
4. **Minimal dependencies:** Only React and ReactDOM as runtime dependencies — no game framework, physics library, or sprite engine.
5. **CSS animations over JS:** Visual effects (walking, breathing, wing flapping, coin spinning) are handled by CSS animations, offloading work to the browser's compositor thread.

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Pure CSS over Canvas/WebGL** | Demonstrates advanced CSS skills; allows React's component model to manage the scene graph; no asset loading |
| **Mutable state + force render** | A traditional game loop needs mutable state for performance; React's immutable `useState` would create thousands of object copies per second |
| **Two-pass collision resolution** | Separating X and Y collision passes prevents diagonal movement bugs that plague single-pass systems |
| **Buffered jump input** | A 150ms input buffer makes jump timing forgiving, which is critical for platformer feel |
| **Config-driven constants** | Every physics value in one file enables rapid playtesting and balance iteration |
| **Zone parameter threading** | Rather than global state, the zone is passed explicitly to every physics function, keeping the system pure and testable |
| **Declarative warp pipe config** | Adding new warp pipes is a data change, not a code change — just add an entry to the `WARP_PIPES` array |

---

## Feature Summary

- Smooth 60fps game loop with `requestAnimationFrame`
- Full platformer physics: gravity, terminal velocity, two-pass tile collision
- Jump and double-jump with buffered input detection
- 3 enemy types with distinct AI (Goomba, Flyer, Turtle with shell mechanics)
- Power-up system (Mushroom growth, timed Fire Flower with fireball combat)
- Interactive blocks: breakable bricks, coin blocks, multi-coin blocks, power-up blocks
- Multi-zone level design (overworld + underground) with warp pipe transitions
- Directional warp pipe animations (sink, transition, emerge up/down)
- Flag pole win sequence with slide-down and auto-walk
- Score system with animated popups
- Lives system with respawn
- HUD overlay with score, lives, and coin count
- Responsive scaling for smaller screens
- Start screen, win screen, and game over screen
- 100% pure CSS pixel art — zero image assets
- TypeScript throughout with strict type checking

---

## Project Statistics

| Metric | Value |
|--------|-------|
| **Runtime dependencies** | 2 (React, ReactDOM) |
| **Dev dependencies** | 5 (TypeScript, Vite, plugin-react, Sass, React types) |
| **React components** | 10 |
| **SCSS files** | 16 |
| **CSS animations** | 20+ keyframes |
| **Game engine (useGameState.ts)** | ~1,070 lines |
| **Total source files** | ~30 |
| **Image assets** | 0 |
| **Overworld map size** | 80×12 tiles (3,840×576 px) |
| **Underground map size** | 20×12 tiles (960×576 px) |
| **Enemy types** | 3 (Goomba, Flyer, Turtle) |
| **Tile types** | 8 |
| **Power-up types** | 2 (Mushroom, Fire Flower) |
| **Build output** | ~168 KB JS + ~19 KB CSS (gzipped: ~53 KB + ~4 KB) |
