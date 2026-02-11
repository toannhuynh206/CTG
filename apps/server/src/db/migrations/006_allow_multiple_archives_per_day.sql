-- Allow multiple archives on the same date.
-- Previously, archived_date was unique, which merged same-day archives.
ALTER TABLE game_archives
DROP CONSTRAINT IF EXISTS game_archives_archived_date_key;
