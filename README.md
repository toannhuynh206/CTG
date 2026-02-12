# CTG - Chicago Transit Games

A full-stack puzzle game platform themed around Chicago's CTA train system. Players compete to solve two puzzles — **Connections** and a **Mini Crossword** — against a shared timer for the fastest time on the leaderboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router 6, Zustand, Vite |
| **Backend** | Express 4, Node.js (ESM) |
| **Database** | PostgreSQL 16 |
| **Shared** | TypeScript package with types + constants |
| **Monorepo** | pnpm workspaces |

## Project Structure

```
CTG/
├── apps/
│   ├── server/          # Express API (port 3001)
│   │   ├── src/
│   │   │   ├── db/           # Pool, migrations
│   │   │   ├── middleware/   # session, gameGate
│   │   │   ├── routes/       # game, leaderboard, schedule, admin
│   │   │   ├── services/     # gameService, settingsService, archiveService, etc.
│   │   │   └── index.ts      # Express app entry
│   │   └── .env
│   └── web/             # React SPA (port 5180)
│       └── src/
│           ├── api/          # HTTP client
│           ├── components/   # UI components (crossword/, connections/, game/, ui/)
│           ├── pages/        # Route pages
│           ├── stores/       # Zustand store (gameStore)
│           └── styles/       # Global CSS with CTA theme
└── packages/
    └── shared/          # @ctg/shared — types, constants
        └── src/
            ├── types.ts
            ├── constants.ts
            └── index.ts
```

## Game Flow

```
1. Admin sets puzzles via /admin panel
2. Admin unlocks the game
3. Players visit home page → register (name, state, Instagram)
4. Player enters Game Hub → chooses Connections or Crossword (either order)
5. Timer starts on first puzzle open
6. Connections: Find 4 groups of 4 related words (4 mistakes allowed)
7. Crossword: Solve 5x5 mini crossword (3 submit attempts)
8. Player completes both puzzles → timer stops → total time recorded
9. Completed players can view the leaderboard immediately
10. Admin locks the game → leaderboard visible to everyone
11. Admin archives the game → saves leaderboard + puzzle data, wipes all sessions
```

### Timer Rules

- **Starts** when the player opens their first puzzle (server-side `started_at`)
- **Stops** when both puzzles are completed (server-side `completed_at`)
- Timer also stops early if connections fail (4 wrong guesses) or crossword give-up/3 failed attempts
- Failed players are excluded from the leaderboard
- If one puzzle fails, the player can still play the other for fun, but won't appear on leaderboard

### Connections Rules

- 4 groups of 4 words, shuffled randomly
- Player selects 4 words and submits a guess
- Correct group revealed with CTA-themed color (Yellow/Green/Blue/Purple by difficulty)
- "One away" hint if 3 of 4 words are from the same group
- Duplicate guess detection prevents wasting a mistake
- 4 mistakes = connections failed
- Player stays on page after completion to review categories before continuing
- Per-player word order persisted across refreshes

### Crossword Rules

- 5x5 mini crossword grid
- 3 attempts to submit the full grid
- On wrong submission: correct cells are "cemented" (locked green), wrong cells highlighted red
- Cemented cells are physically non-editable (rendered as divs, not inputs)
- Submit button highlighted when all cells are filled
- Attempt dots show remaining tries
- "Give Up" option with confirmation dialog
- Player stays on page after completion to see the solved board

## Database Schema

### Tables (5 active)

**`current_puzzle`** — Single-row table holding the active game
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Always 1 (CHECK constraint) |
| connections_data | JSONB | Groups with words, labels, difficulty |
| crossword_data | JSONB | Grid, clues, answers |
| updated_at | TIMESTAMPTZ | |

**`players`** — Registered players
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(100) | |
| city | VARCHAR(100) | US state (validated) |
| instagram | VARCHAR(100) | Unique (case-insensitive index) |
| session_token | UUID | Unique, auto-generated |
| created_at | TIMESTAMPTZ | |

**`game_sessions`** — One per player, tracks all game state
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| player_id | UUID | FK → players, unique |
| started_at | TIMESTAMPTZ | Timer start |
| completed_at | TIMESTAMPTZ | Timer stop |
| first_puzzle | VARCHAR(20) | Which puzzle was opened first |
| connections_state | JSONB | `{solved_groups, mistakes, failed, completed, word_order}` |
| crossword_state | JSONB | `{completed, failed, attempts, cemented_cells, current_grid}` |
| connections_completed | BOOLEAN | |
| crossword_completed | BOOLEAN | |
| total_time_ms | INTEGER | Final time in milliseconds |
| failed | BOOLEAN | True if any puzzle failed |

**`game_settings`** — Key-value configuration
| Column | Type | Notes |
|--------|------|-------|
| key | VARCHAR(100) | Unique (e.g. `game_locked`) |
| value | JSONB | e.g. `{"locked": true}` |

**`game_archives`** — Historical games
| Column | Type | Notes |
|--------|------|-------|
| archived_date | DATE | Unique |
| connections_data | JSONB | Puzzle data snapshot |
| crossword_data | JSONB | Puzzle data snapshot |
| leaderboard | JSONB | Array of `{player_name, city, instagram, time_ms, rank}` |

## API Endpoints

### Schedule
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/schedule/status` | None | Game availability, lock status, server time |

### Game
| Method | Path | Auth | Middleware | Description |
|--------|------|------|-----------|-------------|
| POST | `/api/v1/game/register` | None | registerLimiter (5/15min) | Register player (blocked when locked) |
| GET | `/api/v1/game/state` | Session | | Get current game session state |
| POST | `/api/v1/game/start-puzzle` | Session | gameGate | Start connections or crossword, returns puzzle data |
| POST | `/api/v1/game/connections/guess` | Session | gameGate, guessLimiter (30/min) | Submit 4-word guess |
| POST | `/api/v1/game/connections/reorder` | Session | gameGate | Persist player's tile order |
| POST | `/api/v1/game/crossword/submit` | Session | gameGate, guessLimiter (30/min) | Submit crossword grid (3 attempts max) |
| POST | `/api/v1/game/crossword/give-up` | Session | gameGate | Give up crossword |

### Leaderboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/leaderboard` | Optional Session | Visible to finished players or when game is locked |

### Admin
All admin routes require `X-Admin-Key` header (except login).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/login` | Validate admin password, returns session token |
| GET/POST | `/api/v1/admin/lock` | Get/set game lock status |
| GET | `/api/v1/admin/current-puzzle` | Get current puzzle data |
| POST | `/api/v1/admin/current-puzzle/connections` | Set connections puzzle |
| POST | `/api/v1/admin/current-puzzle/crossword` | Set crossword puzzle |
| GET | `/api/v1/admin/players` | List current players with status |
| POST | `/api/v1/admin/archive` | Archive current game + wipe sessions |
| GET | `/api/v1/admin/archives` | List all archives |
| GET | `/api/v1/admin/archives/:id` | Get specific archive |

## Frontend Routes

### Player
| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomePage | Landing page with CTA theme selector |
| `/register` | PlayerInfoPage | Registration form (name, state dropdown, Instagram) |
| `/game` | GameHubPage | Puzzle selection hub |
| `/game/connections` | ConnectionsPage | Connections puzzle with shuffle/reorder |
| `/game/crossword` | CrosswordPage | Mini crossword with cemented cells |
| `/complete` | CompletionPage | Game complete summary with time |
| `/leaderboard` | LeaderboardPage | Ranked leaderboard display |

### Admin
| Path | Component |
|------|-----------|
| `/admin/:secretKey` | AdminLoginPage |
| `/admin/:secretKey/dashboard` | AdminDashboardPage (lock, players, archive) |
| `/admin/:secretKey/connections` | AdminConnectionsPage (puzzle editor + samples) |
| `/admin/:secretKey/crossword` | AdminCrosswordPage (grid editor + samples) |
| `/admin/:secretKey/archive/:date` | AdminArchivePage |

## Authentication

- **Player auth**: UUID session token generated at registration, stored in `localStorage`, sent via `X-Session-Token` header
- **Admin auth**: Password validated against `ADMIN_API_KEY` env var using timing-safe comparison, returns HMAC-signed session token with configurable TTL, stored in `sessionStorage`, sent via `X-Admin-Key: Bearer <token>` header
- Invalid/expired tokens return 401 → frontend clears token and redirects

## Security

- **Startup validation**: Server fails fast if `ADMIN_API_KEY` is not set
- **Admin auth**: Timing-safe password comparison, HMAC-signed tokens with expiry
- **Game lock** (`gameGate` middleware): Blocks gameplay routes when game is locked
- **Rate limiting**: 5 registrations per 15 min, 30 guesses per min, 10 admin logins per 15 min
- **Duplicate prevention**: Unique case-insensitive index on Instagram handle, `ON CONFLICT DO NOTHING` for atomic registration
- **Input validation**: Instagram handle regex (`/^[a-zA-Z0-9._]{1,30}$/`), 50-char max on fields, US state whitelist, crossword grid dimensions validated
- **Server-side timing**: `started_at`, `completed_at`, `total_time_ms` all computed server-side — client cannot manipulate
- **No free intel**: Crossword only has submit (no check endpoint), connections answers never sent to client
- **Concurrency safe**: All state mutations use PostgreSQL transactions with `SELECT ... FOR UPDATE` row-level locking. `getOrCreateSession` uses atomic `INSERT ... ON CONFLICT DO NOTHING`. `startPuzzle` uses conditional `WHERE started_at IS NULL`. `completeGame` guards double-completion.
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- **CORS**: Configurable allowed origins
- **Body size limit**: 100kb max on JSON payloads

## Theming

The app uses CTA train line colors as dynamic themes. Players choose their "line" on the home page:

| Line | Color |
|------|-------|
| Blue (O'Hare) | `#00A1DE` |
| Red (Howard) | `#C60C30` |
| Brown (Kimball) | `#62361B` |
| Green (Ashland) | `#009B3A` |
| Purple (Linden) | `#522398` |
| Orange (Midway) | `#F9461C` |
| Yellow (Skokie) | `#F9E300` |
| Pink (54th) | `#E27EA6` |

Supports light and dark mode via CSS variables. Button system uses `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-danger` variants that adapt to the selected theme.

## Development

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL 16

### Setup
```bash
# Install dependencies
pnpm install

# Create database
createdb ctg

# Run migrations
cd apps/server && pnpm migrate
```

### Running
```bash
# Start both frontend + backend
pnpm dev

# Or individually:
cd apps/server && pnpm dev    # Backend on :3001
cd apps/web && pnpm dev       # Frontend on :5180
```

### Environment Variables

See `apps/server/.env.example`:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PORT` | Server port (default: 3001) | No |
| `ADMIN_API_KEY` | Admin panel password | **Yes** |
| `ADMIN_SESSION_SECRET` | Secret for signing admin tokens (falls back to ADMIN_API_KEY) | No |
| `ADMIN_TOKEN_TTL_SECONDS` | Admin token expiry (default: 7200) | No |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | Yes |
| `DEV_MODE` | Enables `/dev-complete` test endpoint (default: false) | No |

### Docker Deployment

The backend ships with a Dockerfile at `apps/server/Dockerfile`. It uses the repo root as build context so the shared package is included.

```bash
# Build from repo root
docker build -f apps/server/Dockerfile -t ctg-server .

# Run (pass env vars)
docker run -d \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/ctg \
  -e ADMIN_API_KEY=your-secret \
  -e CORS_ORIGIN=https://yourdomain.com \
  ctg-server
```

The container automatically runs migrations on startup, then starts the server.

The frontend (`apps/web`) is a static Vite build — deploy the output of `pnpm -C apps/web build` to any static host (Vercel, Netlify, S3, Nginx, etc.) with the API proxy pointed at the backend.

### Production Checklist
- [ ] Set `DEV_MODE=false` (or leave unset)
- [ ] Set strong `ADMIN_API_KEY`
- [ ] Set `ADMIN_SESSION_SECRET` (separate from API key for better security)
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Migrations run automatically in Docker on startup
- [ ] Set up HTTPS via reverse proxy
- [ ] Configure `trust proxy` if behind a load balancer/CDN

## Admin Workflow

1. Navigate to `/admin/ctgadmin2026`
2. Log in with admin password
3. Set Connections puzzle (4 groups of 4 words with difficulty/color)
4. Set Crossword puzzle (5x5 grid with clues) — sample puzzles available
5. Unlock the game → players can register and play
6. Monitor players via dashboard (name, Instagram, playing/completed/failed status)
7. Lock the game → registration closed, leaderboard visible to all
8. Archive → saves leaderboard + puzzle data, wipes all player data for next game
