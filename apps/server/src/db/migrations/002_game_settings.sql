-- Game Settings Table
CREATE TABLE IF NOT EXISTS game_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default game lock setting (unlocked by default)
INSERT INTO game_settings (key, value)
VALUES ('game_locked', '{"locked": false}')
ON CONFLICT (key) DO NOTHING;
