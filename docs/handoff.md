# Monkey Flipper — Migration Handoff

## What Was Done

Ported the Phaser 3 balloon-jumping game from the old vanilla JS project (`src/index.js`, ~7600 LOC) into the new React 19 + Vite + Tailwind app (`new/`). Goal was minimum working version — solo play only.

### Files Created / Modified

| File | What |
|---|---|
| `new/src/game/index.js` | Core game module (~1170 lines). Stripped-down `GameScene` from old project — solo play only, no duels/boosts/shop/profile scenes. Exports `createGame(containerId)` and `destroyGame(game)`. |
| `new/src/PhaserGame.tsx` | React wrapper. Manages Phaser lifecycle via `useEffect` (mount → create, unmount → destroy). Listens to Phaser event `exitToMenu` to return to lobby. |
| `new/src/App.tsx` | Added `isPlaying` state. Game tab shows PLAY button over Rive lobby; when playing, Phaser replaces Rive and nav bar hides. |
| `new/tsconfig.json` | Added `allowJs: true` so TS can import the `.js` game module. |
| `new/public/assets/` | Copied all sprites/backgrounds from old `assets/` directory. |

### What's Working

- Full gameplay loop: monkey auto-bounces on balloons, height-based scoring, parallax background transitions
- Touch controls: screen split into left/center/right thirds (move left / jump / move right)
- Keyboard controls: A/D or arrows for movement, W or up-arrow or space for jump
- Fall detection: after 1s of falling without landing, ground appears; landing on ground = game over
- Game over screen: score, best score (localStorage), NEW RECORD indicator, Restart and Menu buttons
- Score saving: POST to `https://monkey-flipper-djm1.onrender.com/api/save-score`, falls back to localStorage pending queue when server is offline
- Restart: `scene.restart()` resets everything cleanly
- Menu: emits `exitToMenu` via Phaser event system → React unmounts Phaser, returns to Rive lobby

### What Was Stripped Out

Everything non-essential for solo play MVP:

- **14 → 1 scene**: Kept only `GameScene`. Removed `BootScene`, `LobbyScene`, `PvPMenuScene`, `DuelScene`, `DuelResultsScene`, `ProfileScene`, `ShopScene`, `SettingsScene`, etc.
- **Multiplayer/duels**: All Socket.IO logic, duel polling, opponent rendering, split-screen
- **Boost system**: `applyBoostEffects()`, `loadEquippedItems()`, boost shop integration
- **Payment systems**: TON Connect, Telegram Stars purchases
- **Equipped cosmetics**: Skin/trail/effect loading from API
- **Sounds**: All audio (game has no sound currently)
- **Ads**: Adsgram rewarded video integration

---

## Important Notes for Devs

### Phaser ↔ React Communication

Phaser runs in its own canvas and has no awareness of React. Communication uses Phaser's built-in event system:

```
// Game → React (e.g. exit to menu)
this.game.events.emit('exitToMenu')

// React listens
game.events.on('exitToMenu', onExit)
```

Do **not** use module-level callbacks (`let _onExitGame = null`) — they're unreachable from outside the module and break if the game is destroyed/recreated. The Phaser event bus is the right pattern.

### Game Lifecycle

The React component (`PhaserGame.tsx`) owns the Phaser instance lifecycle:

1. Component mounts → `createGame(containerId)` → Phaser boots with canvas inside the div
2. Component unmounts → `destroyGame(game)` → Phaser is fully torn down

Never call `game.destroy()` from inside Phaser scenes — always go through React. If you destroy the game without updating React state, you get a black screen (React still thinks `isPlaying=true` but the canvas is gone).

### The Game Module is Plain JS

`game/index.js` is vanilla JavaScript, not TypeScript. This was intentional — the old codebase is JS and converting ~1200 lines to TS wasn't worth it for the MVP. `allowJs: true` in tsconfig handles the interop.

If you want to add types later, the main things to type are:
- `CONSTS` object (game dimensions, physics values)
- `GameScene` class (extends `Phaser.Scene`)
- `createGame` / `destroyGame` exports

### Canvas Sizing

`CONSTS.WIDTH` is capped at 430px (matching the app's `max-w-[430px]`). Height is set to `window.innerHeight`. The Phaser config uses `scale.mode: Phaser.Scale.NONE` — no auto-scaling. The container div is `absolute inset-0` so it fills the parent.

If you change the app's max-width, update `CONSTS.WIDTH` in `game/index.js` too.

### Touch Controls

Screen is split into thirds horizontally:
- **Left third**: move left
- **Center third**: jump
- **Right third**: move right

This is set up in `setupTouchControls()`. The zones are invisible Phaser rectangles. On desktop, keyboard input works too (WASD / arrows / space).

### Physics Constants

Key values in `CONSTS` that affect gameplay feel:

| Constant | Value | What it does |
|---|---|---|
| `GRAVITY` | 650 | Downward pull |
| `JUMP_VELOCITY` | -500 | Upward impulse on jump |
| `BOUNCE_VELOCITY` | -450 | Upward impulse when landing on balloon |
| `MOVE_SPEED` | 200 | Horizontal movement speed |
| `PLATFORM_COUNT` | 25 | Number of balloons generated |
| `FALL_TIMEOUT` | 1000 | ms of falling before ground appears |

### Score Saving

`saveScoreToServer(userId, score)` does a POST to the API. On failure, it queues the score in `localStorage` under `pendingScores`. There's no retry mechanism — the pending queue is never flushed automatically. You'd need to add that if offline support matters.

The Telegram user ID comes from `window.Telegram.WebApp.initDataUnsafe.user.id`. Falls back to a random anonymous ID stored in localStorage.

### Background Transitions

The game has 4 parallax background layers (`back_1` through `back_4`) that crossfade as the player climbs higher. Transition heights are hardcoded in `updateBackgroundTransitions()`. Each layer uses `setScrollFactor()` for the parallax effect.

### Debugging

`window.__PHASER_GAME__` is set in `createGame()` for console access. You can do:

```js
const scene = window.__PHASER_GAME__.scene.scenes[0]
scene.handleJump()           // trigger a jump
scene.player.y               // check position
scene.score                  // check score
scene.scene.restart()        // restart
```

### Known Gaps

1. **No sound** — all audio was stripped. The old project had jump/bounce/game-over sounds.
2. **Leaderboard uses fake data** — Top tab shows `FAKE_TOP_DATA` in `App.tsx` instead of fetching from `/api/leaderboard`.
3. **No pending score flush** — scores saved while offline stay in localStorage forever.
4. **No cosmetics** — skins/trails/effects from the shop aren't loaded.
5. **No multiplayer** — duels, matchmaking, Socket.IO — all removed.
6. **Keyboard input via Chrome DevTools doesn't work** — Phaser's keyboard handler doesn't receive synthetic key events from automation tools. This is a testing limitation only; real keyboard/touch input works fine in browsers.
7. **No game-over animation** — the monkey just stops; old project had a fall-to-floor sprite sequence that could be restored.
