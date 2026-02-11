-- Clean up legacy tables and columns from old date-based architecture

-- Drop FK constraint from game_sessions to puzzles
ALTER TABLE game_sessions DROP CONSTRAINT IF EXISTS game_sessions_puzzle_id_fkey;

-- Drop the unused puzzle_id column
ALTER TABLE game_sessions DROP COLUMN IF EXISTS puzzle_id;

-- Drop the puzzle_id index
DROP INDEX IF EXISTS idx_game_sessions_puzzle;

-- Drop legacy tables
DROP TABLE IF EXISTS leaderboard_snapshots;
DROP TABLE IF EXISTS puzzles;

-- Add case-insensitive index on instagram for duplicate detection
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_instagram_lower ON players (LOWER(instagram));
