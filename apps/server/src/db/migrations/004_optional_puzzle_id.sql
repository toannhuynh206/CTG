-- Make puzzle_id optional in game_sessions (for new architecture)
ALTER TABLE game_sessions ALTER COLUMN puzzle_id DROP NOT NULL;

-- Drop the unique constraint that required puzzle_id
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_player_id_puzzle_id_key;

-- Add new unique constraint on player_id only (one session per player)
ALTER TABLE game_sessions ADD CONSTRAINT game_sessions_player_id_unique UNIQUE (player_id);
