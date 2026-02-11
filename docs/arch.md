# Monkey Flipper - Architecture Overview

## What Is This

Telegram Mini App multiplayer game. A monkey jumps on balloons (platforms), trying to go as high as possible. Modes: solo play, real-time 1v1 matchmaking, async duels, tournaments. Has in-game shop with Telegram Stars and TON payments.

---

## Deployment Topology

```
                   Vercel                          Render.com (x2)
              +--------------+          +-----------------------------+
  Telegram    |   Frontend   |          |  API Server (server-api.js) |
  WebApp  --> |  index.html  | -REST--> |  Express + PostgreSQL       |
  (iframe)    |  shop.html   |          |  monkey-flipper-djm1.onrender.com
              |  src/index.js|          +-----------------------------+
              |  (Phaser 3)  |
              |              |          +-----------------------------+
              |  Socket.IO   | --WS---> |  1v1 Server (server.js)     |
              |  Client      |          |  Express + Socket.IO        |
              +--------------+          |  monkey-flipper-1v1.onrender.com
                                        +-----------------------------+
```

- **Frontend**: Vercel (static files + Phaser 3 game)
- **API Server**: Render.com Starter $7/mo (`monkey-flipper-djm1.onrender.com`)
- **1v1 Socket Server**: Render.com Starter $7/mo (`monkey-flipper-1v1.onrender.com`)
- **Database**: PostgreSQL Render Basic-1gb $19/mo (connected via `DATABASE_URL`)
- **Total Render cost: $33/month**

---

## Deployment

All services deploy from the **same repo** (`arthurianno/monkey-flipper`, `main` branch).

| Service | Platform | Trigger | Root Dir | Build | Start |
|---------|----------|---------|----------|-------|-------|
| Frontend | Vercel | Auto on push to `main` | — | — (static files) | — |
| API Server | Render | **Manual** (dashboard button) | `monkey-flipper-api/` | `npm install` | `npm start` |
| 1v1 Socket Server | Render | **Manual** (dashboard button) | _(root)_ | `npm install` | `node server.js` |
| PostgreSQL | Render | Always running (managed) | — | — | — |

No CI/CD pipeline, no GitHub Actions. Vercel auto-deploys the frontend on every push. Both Render backends require manually clicking "Manual Deploy" in the Render dashboard. The API server has Auto-Deploy set to "On Commit" in Render UI but it does **not** trigger automatically — deploys are manual.

**Health check:** `GET /api/new/health` returns `{ status: "ok", timestamp: "..." }`

**Environment variables** — stored in Render dashboard, not in repo (`.env` is gitignored):

| Service | Env Vars |
|---------|----------|
| API Server | `BOT_TOKEN`, `DATABASE_URL`, `JWT_SECRET`, `monkeytest`, `TON_WALLET_ADDRESS` |
| 1v1 Socket Server | _(none)_ |
| Frontend (Vercel) | _(none — API URLs hardcoded in `src/index.js`)_ |

> **Note:** `.env.example` lists additional vars (`ENCRYPTION_KEY`, RSA keys, `FRONTEND_URL`) that are **not set** in production Render.

> **Note:** `render.yaml` in the repo is outdated and not used — both services were configured manually through the Render UI. The table above reflects the actual Render dashboard settings (verified Feb 2026).

---

## Real-Time: How It Works

**Technology: Socket.IO 4.6.1** - yes, raw stateful WebSocket server. No Redis adapter, no pub/sub, no clustering.

### The Good
- Simple and works for the current scale
- Socket.IO handles transport fallback (WS -> long-polling) automatically
- Low latency for 1v1 - direct event relay between two sockets

### The Bad
- **100% in-memory state** - `matchmakingQueue` is a plain array, `gameRooms` is a `Map`
- Server restart = all active games lost, all queued players dropped
- No persistence layer, no Redis, no recovery mechanism
- **Cannot scale horizontally** - two instances would have separate queues/rooms
- Render free tier sleeps after inactivity - first connect has cold start latency
- CORS is `origin: '*'` (wide open)

### Event Flow

```
Client A                    Socket.IO Server                 Client B
   |                              |                              |
   |-- findMatch({userId}) ------>|                              |
   |                              |<----- findMatch({userId}) ---|
   |                              |                              |
   |                         [Queue has 2]                       |
   |                         [Create GameRoom]                   |
   |                              |                              |
   |<-- gameStart({opponent}) ----|---- gameStart({opponent}) -->|
   |                         [1s delay]                          |
   |<-- countdown(3) ------------|---- countdown(3) ----------->|
   |                              |                              |
   |-- playerUpdate({x,y,score})->|                              |
   |                              |-- opponentUpdate({x,y}) --->|
   |                              |                              |
   |                              |<- playerUpdate({x,y,score}) -|
   |<- opponentUpdate({x,y}) ----|                              |
   |                              |                              |
   |-- playerUpdate({isAlive:0})->|                              |
   |                         [checkGameEnd()]                    |
   |<-- gameEnd({winner}) --------|---- gameEnd({winner}) ----->|
   |                         [Room deleted after 10s]            |
```

### Game Room Lifecycle

1. Two players emit `findMatch` -> FIFO queue pairs them
2. `GameRoom` created with shared seed (for deterministic platforms)
3. 1s delay, then `countdown` event, status -> `playing`
4. Players send `playerUpdate` every ~100ms (position, score, alive)
5. Server relays to opponent as `opponentUpdate`
6. Game ends when: someone falls (`isAlive: false`), both fall (higher score wins), or 2min timeout
7. Room deleted 10s after game ends

---

## Backend Stack

### API Server (`monkey-flipper-api/server-api.js`, ~5000 LOC)

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 4.18.2 |
| Database | PostgreSQL via `pg` 8.11.3 (connection pool, SSL) |
| Auth | JWT (jsonwebtoken 9.0.2) + Telegram initData HMAC-SHA256 validation |
| Bot | node-telegram-bot-api 0.66.0 |
| Rate Limiting | express-rate-limit 7.1.5 |
| Encryption | AES-256-GCM (wallet addresses), RSA signatures (anti-cheat) |
| HTTP Client | Axios 1.13.2 |

**This server is stateless** - all state in PostgreSQL.

### Socket.IO Server (`server.js`, 370 LOC)

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 4.18.2 |
| Real-time | Socket.IO 4.6.1 |
| State | In-memory (Map + Array) |

**This server is fully stateful** - no database, no Redis, no persistence.

---

## Database Schema (PostgreSQL)

| Table | Purpose |
|-------|---------|
| `users` | telegram_id, username, equipped items, last login |
| `player_scores` | Score history per user |
| `duels` | Async 1v1 challenges (positions, scores, status, seed) |
| `wallets` | Balances: monkey coins, stars, TON (addresses encrypted) |
| `transactions` | All financial ops with nonce + signature |
| `purchases` | Shop purchases with charge IDs |
| `tournaments` | Tournament state (managed by cron) |
| `audit_log` | Security audit trail |

---

## Frontend Stack

- **Phaser 3.90.0** - game engine (Canvas rendering)
- **Socket.IO Client 4.6.1** - real-time comms
- **Telegram Web App SDK** - Mini App integration
- **TON Connect UI 2.0.0** - blockchain wallet
- **Vanilla JS** - no React/Vue/Angular, one big `src/index.js` (~7600 LOC)
- Deployed on **Vercel** (static hosting)

---

## Security

- Telegram `initData` validated server-side via HMAC-SHA256
- JWT tokens with 24h TTL
- Rate limiting: 5 req/min on game result submission
- AES-256-GCM for wallet address encryption
- RSA signatures for anti-cheat game event validation
- CORS whitelist on API server (but `*` on Socket.IO server)

---

## Payment Systems

| Method | Currency | Backend |
|--------|----------|---------|
| Telegram Stars (XTR) | Real money via Telegram | Bot API invoices + webhook callbacks |
| Monkey Coins | In-game currency | Earned by playing, stored in `wallets` table |
| TON | Cryptocurrency | TON Connect, testnet/mainnet support |

---

## Missing Environment Variables in Production

Several vars from `.env.example` are **not set** on Render. The code doesn't crash — it silently degrades:

| Variable | Fallback behavior | Impact |
|----------|------------------|--------|
| `ENCRYPTION_KEY` | `crypto.randomBytes(32)` — new random key every restart | Encrypted wallet addresses in DB become undecryptable after restart |
| `CLIENT_PUBLIC_KEY` | `if (publicKey && ...)` check skipped | Transaction signature verification disabled |
| `SERVER_PUBLIC_KEY` | Same pattern — check skipped | Reward signature verification disabled |
| `SERVER_PRIVATE_KEY` | Never referenced in code | Dead `.env.example` entry, unused |
| `FRONTEND_URL` | Falls back to `http://localhost:3000` | No real impact — Telegram/Vercel origins are hardcoded in CORS list |
| `NODE_ENV` | Never referenced in code | No impact |

In practice: the RSA anti-cheat system is fully disabled (keys not set, checks silently bypassed), and wallet encryption uses a throwaway key. Likely never configured since this is a vibecoded project.

---

## Known Architectural Risks

1. **Socket.IO server has zero persistence** - any restart loses all active games
2. **No horizontal scaling** - single-process, in-memory state, no Redis adapter
3. **Render Starter tier** - low resources (512MB RAM, 0.5 CPU per service)
4. **No reconnection handling** - if a player's WebSocket drops mid-game, opponent auto-wins, no rejoin
5. **Single 7600-line JS file** for the entire frontend
6. **CORS `*`** on the Socket.IO server

## Verdict

Yes, it's a rawdogged stateful Socket.IO server with everything in memory. No Redis, no message broker, no clustering. Running on Render Starter tier ($33/mo total for 2 services + DB). Works fine for a Telegram mini-game at low scale, but would need Redis adapter + persistence to survive restarts or scale beyond one process.
