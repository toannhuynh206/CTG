-- CTG Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Puzzles: one per Monday
CREATE TABLE puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  connections_data JSONB NOT NULL,
  crossword_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_puzzles_date ON puzzles(date);

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  instagram VARCHAR(100) NOT NULL,
  session_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_session_token ON players(session_token);

-- Game Sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id),
  puzzle_id UUID NOT NULL REFERENCES puzzles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  first_puzzle VARCHAR(20),
  connections_state JSONB NOT NULL DEFAULT '{"solved_groups":[],"mistakes":0,"failed":false,"completed":false}',
  crossword_state JSONB NOT NULL DEFAULT '{"completed":false}',
  connections_completed BOOLEAN NOT NULL DEFAULT FALSE,
  crossword_completed BOOLEAN NOT NULL DEFAULT FALSE,
  total_time_ms INTEGER,
  failed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, puzzle_id)
);

CREATE INDEX idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX idx_game_sessions_puzzle ON game_sessions(puzzle_id);

-- Leaderboard Snapshots
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE NOT NULL,
  rankings JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_date ON leaderboard_snapshots(puzzle_date);
