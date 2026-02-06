-- New architecture: single current puzzle + archives

-- Current puzzle (single row, always id=1)
CREATE TABLE IF NOT EXISTS current_puzzle (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  connections_data JSONB,
  crossword_data JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert empty current puzzle
INSERT INTO current_puzzle (id, connections_data, crossword_data)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Game archives (historical games)
CREATE TABLE IF NOT EXISTS game_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archived_date DATE NOT NULL UNIQUE,
  connections_data JSONB NOT NULL,
  crossword_data JSONB NOT NULL,
  leaderboard JSONB NOT NULL, -- Array of {player_name, city, instagram, time_ms, rank}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_archives_date ON game_archives(archived_date);
