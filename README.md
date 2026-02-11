wh# CTG - Chicago Transit Games

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
│   │   │   ├── db/           # Pool, migrations, seed
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
4. Player enters Game Hub → chooses Connections or Crossword
5. Timer starts on first puzzle open
6. Player completes both puzzles → timer stops → total time recorded
7. Completed players can view the leaderboard immediately
8. Admin locks the game → leaderboard visible to everyone
9. Admin archives the game → saves leaderboard + puzzle data, wipes all sessions/players
```

### Timer Rules

- **Starts** when the player opens their first puzzle (server-side `started_at`)
- **Stops** when both puzzles are completed (server-side `completed_at`)
- Timer also stops early if connections fail (4 wrong guesses) or crossword give-up
- Failed players are excluded from the leaderboard
- If one puzzle fails, the player can still play the other for fun, but won't appear on leaderboard

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
| connections_state | JSONB | `{solved_groups, mistakes, failed, completed}` |
| crossword_state | JSONB | `{completed, failed, current_grid}` |
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
| POST | `/api/v1/game/crossword/submit` | Session | gameGate, guessLimiter (30/min) | Submit crossword grid |
| POST | `/api/v1/game/crossword/give-up` | Session | gameGate | Give up crossword |

### Leaderboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/leaderboard` | Optional Session | Visible to finished players or when game is locked |

### Admin
All admin routes require `X-Admin-Key` header (except login).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/login` | Validate admin password |
| GET/POST | `/api/v1/admin/lock` | Get/set game lock status |
| GET | `/api/v1/admin/current-puzzle` | Get current puzzle data |
| POST | `/api/v1/admin/current-puzzle/connections` | Set connections puzzle |
| POST | `/api/v1/admin/current-puzzle/crossword` | Set crossword puzzle |
| POST | `/api/v1/admin/archive` | Archive current game + wipe sessions |
| GET | `/api/v1/admin/archives` | List all archives |
| GET | `/api/v1/admin/archives/:date` | Get specific archive |

## Frontend Routes

### Player
| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/` | HomePage | None | Landing page with theme selector |
| `/register` | PlayerInfoPage | LockGuard | Registration form |
| `/game` | GameHubPage | None | Puzzle selection hub |
| `/game/connections` | ConnectionsPage | None | Connections puzzle |
| `/game/crossword` | CrosswordPage | None | Mini crossword puzzle |
| `/complete` | CompletionPage | None | Game complete summary |
| `/leaderboard` | LeaderboardPage | None | Leaderboard display |

### Admin
| Path | Component |
|------|-----------|
| `/admin/:secretKey` | AdminLoginPage |
| `/admin/:secretKey/dashboard` | AdminDashboardPage |
| `/admin/:secretKey/connections` | AdminConnectionsPage |
| `/admin/:secretKey/crossword` | AdminCrosswordPage |
| `/admin/:secretKey/archive/:date` | AdminArchivePage |

## Authentication

- **Player auth**: UUID session token generated at registration, stored in `localStorage`, sent via `X-Session-Token` header
- **Admin auth**: Password validated against `ADMIN_API_KEY` env var, admin key stored in `sessionStorage`, sent via `X-Admin-Key` header
- Invalid/expired tokens return 401 → frontend clears token and redirects to home

## Security

- **Game lock** (`gameGate` middleware): Blocks `/start-puzzle`, `/connections/guess`, `/crossword/submit`, `/crossword/give-up`, and `/register` when game is locked
- **Rate limiting**: 5 registrations per 15 min per IP, 30 guesses per min per IP
- **Duplicate prevention**: Unique case-insensitive index on Instagram handle
- **Input validation**: 50-char max on all fields, state must be from US_STATES list, word arrays validated
- **Server-side timing**: `started_at`, `completed_at`, `total_time_ms` all computed on the server — client cannot manipulate
- **No free intel**: Crossword only has submit (no free check endpoint), connections answers never sent to client
- **One away detection**: Server checks if 3/4 words match a group and returns `one_away` flag
- **Duplicate guess detection**: Client tracks previous guesses and blocks re-submission without burning a mistake
- **Archive cleanup**: Archiving deletes both `game_sessions` and `players` tables, invalidating all session tokens

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

Supports light and dark mode via CSS variables.

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

# (Optional) Seed test puzzle
cd apps/server && pnpm seed
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

| Variable | Description | Dev Default |
|----------|-------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://localhost:5432/ctg` |
| `PORT` | Server port | `3001` |
| `ADMIN_API_KEY` | Admin panel password | — |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5180` |
| `DEV_MODE` | Enables `/dev-complete` endpoint | `false` |

### Production Checklist
- [ ] Set `DEV_MODE=false`
- [ ] Set strong `ADMIN_API_KEY`
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Run migrations (`pnpm migrate`)
- [ ] Set up HTTPS (via reverse proxy)

## Admin Workflow

1. Navigate to `/admin/ctgadmin2026`
2. Log in with admin password
3. Set Connections puzzle (4 groups of 4 words)
4. Set Crossword puzzle (5x5 grid with clues)
5. Unlock the game → players can register and play
6. Lock the game → registration closed, leaderboard visible to all
7. Archive → saves leaderboard + puzzle data, wipes all player data for next game
