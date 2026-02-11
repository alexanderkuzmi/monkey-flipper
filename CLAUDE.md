# Monkey Flipper

Telegram Mini App: vertical platformer where a monkey bounces on balloons.

## Migration Status

The app is being rewritten from **plain HTML/JS/Phaser** to a **React + Rive** platform. The old Phaser scenes (menu, profile, leaderboard, shop, etc.) are being replaced by Rive artboards in the React layer. The Phaser game engine itself (`new/public/src/index.js`) stays for core gameplay but the surrounding UI is moving to Rive.

Old files kept for backward compatibility:
- `src/index.js` — original game (reference, not served)
- `new/public/src/index.js` — copy of old game, still used by `game.html`
- Various old Phaser scenes (ProfileScene, LeaderboardScene, etc.) still exist in the game file but are being superseded by Rive artboards

## Architecture

```
React (Rive lobby) ──hard reload──▸ game.html (Phaser 3)
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                  Solo (local)    1v1 (Socket.IO)   Duel (HTTP poll)
                                   port 3000          port 3001
```

- **Frontend**: React 19 + Vite + Tailwind v4 + Rive animations (`new/`)
- **Game**: Phaser 3 loaded via CDN in standalone `game.html`
- **Socket server**: `server.js` — 1v1 matchmaking (port 3000)
- **API server**: `monkey-flipper-api/server-api.js` — Express + PostgreSQL (port 3001)

Navigation between React lobby and Phaser game uses **hard reloads** (`window.location.href`), not SPA routing.

## Servers

### 1. Socket.IO Server (`server.js`, port 3000)

Real-time 1v1 matchmaking and gameplay relay. All state is **in-memory** (no DB, no Redis — lost on restart).

**Data structures:**
- `matchmakingQueue` — FIFO array of waiting players
- `gameRooms` — Map of `GameRoom` instances (stores both players' state, seed, scores)

**Socket events:**
| Event | Direction | Description |
|-------|-----------|-------------|
| `findMatch` | client → server | Join matchmaking queue with userId/username |
| `searching` | server → client | Acknowledgement, waiting for opponent |
| `gameStart` | server → client | Match found — sends roomId, seed, opponent info |
| `countdown` | server → client | 3-second countdown before game starts |
| `playerUpdate` | client → server | Send position (x, y), isAlive, score |
| `opponentUpdate` | server → client | Relayed opponent position/score |
| `gameEnd` | server → client | Game over — reason (fall/timeout/double_fall), winner, scores |
| `cancelMatch` | client → server | Leave matchmaking queue |
| `opponentDisconnected` | server → client | Opponent dropped, you win |

**Game room lifecycle:** countdown (1s) → playing (2 min max) → finished → room deleted (10s cleanup).

**REST endpoints:** `GET /api/stats` (queue size, active games), `GET /api/health`.

### 2. API Server (`monkey-flipper-api/server-api.js`, port 3001)

Express + PostgreSQL. Handles everything persistent. Auth via JWT (24h) + Telegram initData HMAC validation.

**Database tables:** `users`, `player_scores`, `duels`, `wallets`, `transactions`, `purchases`, `audit_log`, `referrals`, `tournaments`, `daily_rewards`, `achievements`

**Key route groups:**

| Group | Routes | Description |
|-------|--------|-------------|
| **Scoring** | `POST /api/game-events`, `POST /api/save-score` | Save game results, server-side score recalculation, coin rewards, referral bonuses |
| **Leaderboard** | `GET /api/leaderboard`, `GET /api/stats/:userId` | Top 100 players, per-player stats (games, scores, rank, wallet) |
| **Duels** | `POST /api/duel/create`, `GET /api/duel/:matchId`, `POST /api/duel/:matchId/accept`, `POST /api/duel/:matchId/complete`, `POST /api/duel/:matchId/position`, `GET /api/duel/:matchId/opponent/:playerId`, `GET /api/duel/history/:userId` | Async challenge links (24h expiry), position polling for ghost opponent, timeout logic |
| **Wallet** | `GET /api/wallet/balance/:userId`, `POST /api/wallet/add-coins`, `GET /api/transactions/:userId` | Monkey coin, STARS, TON balances and transaction history |
| **TON** | `POST /api/wallet/connect-ton`, `POST /api/wallet/disconnect-ton`, `GET /api/wallet/ton-info/:userId` | TON wallet connection/disconnection |
| **STARS** | `POST /api/wallet/connect-stars`, `GET /api/wallet/stars-info/:userId`, `GET /api/stars/balance` | STARS wallet, Telegram Stars (XTR) balance |
| **Shop** | `GET /api/shop/catalog`, `GET /api/shop/items`, `POST /api/shop/purchase`, `POST /api/shop/create-stars-invoice`, `POST /api/shop/purchase-stars`, `POST /api/shop/create-ton-transaction`, `POST /api/shop/confirm-ton-payment` | Item catalog, purchase with monkey coins / STARS / TON |
| **Equipment** | `POST /api/user/equip`, `POST /api/user/unequip`, `POST /api/user/consume-boost`, `GET /api/user/equipped/:userId` | Equip skins, consume boosts |
| **Tournaments** | `GET /api/tournaments/active`, `POST /api/tournaments/:id/join`, `POST /api/tournaments/:id/submit-score`, `POST /api/tournaments/:id/finalize` | Join, play, leaderboard, prize distribution |
| **Daily Rewards** | `GET /api/daily-reward/status/:userId`, `POST /api/daily-reward/claim` | Streak-based daily rewards with weekly multiplier |
| **Achievements** | `GET /api/achievements/:userId`, `POST /api/achievements/check`, `POST /api/achievements/claim` | Progress-based achievements with coin rewards |
| **Referrals** | `GET /api/referral/stats/:userId`, `POST /api/referral/apply`, `POST /api/referral/claim-bonus` | Referral codes, fraud detection, auto-paid bonus on first game |
| **Admin** | `POST /api/admin/login`, `GET /api/admin/stars-transactions`, `POST /api/admin/refund-stars`, `GET /api/admin/purchases-stats` | Admin dashboard, STARS refunds, purchase analytics |

**Security:** Rate limiting (5 req/min on score submission), Telegram initData HMAC-SHA256 validation, JWT auth, CORS whitelist (Telegram origins + Vercel domain).

## Key Files

| File | Description |
|------|-------------|
| `new/src/App.tsx` | React app — Rive lobby, tab navigation (Game/Profile/Top/Shop) |
| `new/src/main.tsx` | Entry point — Telegram SDK init |
| `new/src/config.ts` | Server URLs (localhost vs Render prod) |
| `new/src/lib/telegram.ts` | Telegram WebApp SDK wrapper |
| `new/public/game.html` | Phaser game container (loads CDN scripts + `src/index.js`) |
| `new/public/src/index.js` | **Main game** — 7625 lines, 14 Phaser scenes (legacy, being partially replaced by Rive) |
| `server.js` | Socket.IO server for 1v1 matchmaking (port 3000) |
| `monkey-flipper-api/server-api.js` | API server (port 3001) |
| `src/index.js` | Original game (reference only, not served) |
| `new/public/monkey_new.riv` | Rive animation file (Lobby, Profile, Top, Shop artboards) |

## Phaser Scenes (in `new/public/src/index.js`)

1. **MenuScene** — Main menu, deep link handling (`?start_param=duel_<id>`)
2. **GameScene** — Core gameplay (solo/1v1/duel modes, 2800+ lines)
3. **MatchmakingScene** — Socket.IO 1v1 queue + countdown
4. **PvPMenuScene** — Hub: 1v1 Online / Duels
5. **DuelHistoryScene** — Challenge management
6. **TournamentScene**, **LeaderboardScene**, **ProfileScene**
7. **InventoryScene**, **StatsScene**, **WalletScene**, **AchievementsScene**, **DailyRewardScene**, **ReferralScene**

Auto-mode from URL: `?mode=solo|1v1|tournament` skips MenuScene.

## Game Modes

- **Solo**: Random platforms, local scoring
- **1v1**: Real-time. Socket.IO matchmaking pairs two strangers, shared seed for identical platforms, live ghost opponent via WebSocket relay. 2 min max, all state in-memory (no persistence).
- **Duel**: Async. One player creates a challenge link (shared via Telegram deep link `?start_param=duel_<id>`), other player accepts and plays whenever (24h expiry). Ghost opponent via 500ms HTTP polling instead of WebSocket. 60s timeout after one player finishes. Results persisted in PostgreSQL `duels` table.

## Rive Lobby (App.tsx)

- Artboard `"Lobby"` with swipeable carousel
- State machine inputs: `"Left "` (trailing space), `"Right"`
- ViewModel triggers: `singleGame` → solo, `duelGame` → 1v1, `tournamentGame` → tournament
- ViewModel numbers: `tonCoins`, `starsCoins`, `gameCoins`
- Carousel order: Center=Solo, Left=Tournament, Left again=PvP

## Dev Setup

```bash
npm run dev:all   # Starts all 3: Vite (5173) + Socket.IO (3000) + legacy HTTP (8000)
```

Or individually:
```bash
cd new && npm run dev          # Vite dev server (5173)
npm run dev                    # Socket.IO server (3000)
cd monkey-flipper-api && node server-api.js  # API server (3001)
```

Local PvP testing: open two tabs with `?test=1` to get unique anonymous IDs.

## Deployment

- **Frontend**: Vercel (auto-deploy from `main`, builds `new/dist`)
- **Socket server**: Render (`monkey-flipper-1v1.onrender.com`)
- **API server**: Render (`monkey-flipper-djm1.onrender.com`)

## Conventions

- Copy code patterns from original `src/index.js` — don't rewrite
- Phaser game is vanilla JS (not TypeScript)
- React layer is TypeScript with strict mode
- Back/menu buttons use `window.location.href = '/'` (hard reload to React)
- `GAME_MODES` array in App.tsx must match Rive carousel order: `['solo', 'tournament', '1v1']`
