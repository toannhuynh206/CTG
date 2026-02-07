import pool from '../db/pool.js';
import { getCurrentPuzzle, clearCurrentPuzzle } from './currentPuzzleService.js';

export interface LeaderboardEntry {
  player_name: string;
  city: string;
  instagram: string;
  time_ms: number;
  rank: number;
}

export interface GameArchive {
  id: string;
  archived_date: string;
  connections_data: any;
  crossword_data: any;
  leaderboard: LeaderboardEntry[];
  created_at: string;
}

export async function archiveCurrentGame(): Promise<GameArchive> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current puzzle
    const currentPuzzle = await getCurrentPuzzle();

    if (!currentPuzzle.connections_data || !currentPuzzle.crossword_data) {
      throw new Error('Cannot archive: current puzzle is incomplete');
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Build leaderboard from completed sessions
    const sessionsResult = await client.query(`
      SELECT
        p.name as player_name,
        p.city,
        p.instagram,
        gs.total_time_ms as time_ms
      FROM game_sessions gs
      JOIN players p ON gs.player_id = p.id
      WHERE gs.completed_at IS NOT NULL
        AND gs.failed = FALSE
        AND gs.total_time_ms IS NOT NULL
      ORDER BY gs.total_time_ms ASC
    `);

    const leaderboard: LeaderboardEntry[] = sessionsResult.rows.map((row, index) => ({
      player_name: row.player_name,
      city: row.city,
      instagram: row.instagram,
      time_ms: row.time_ms,
      rank: index + 1,
    }));

    // Insert archive
    const archiveResult = await client.query(`
      INSERT INTO game_archives (archived_date, connections_data, crossword_data, leaderboard)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (archived_date) DO UPDATE SET
        connections_data = EXCLUDED.connections_data,
        crossword_data = EXCLUDED.crossword_data,
        leaderboard = EXCLUDED.leaderboard,
        created_at = NOW()
      RETURNING *
    `, [today, currentPuzzle.connections_data, currentPuzzle.crossword_data, JSON.stringify(leaderboard)]);

    // Clear all game sessions
    await client.query('DELETE FROM game_sessions');

    // Clear all players (invalidates all session tokens)
    await client.query('DELETE FROM players');

    // Clear current puzzle
    await client.query('UPDATE current_puzzle SET connections_data = NULL, crossword_data = NULL, updated_at = NOW() WHERE id = 1');

    await client.query('COMMIT');

    return {
      ...archiveResult.rows[0],
      archived_date: archiveResult.rows[0].archived_date.toISOString().split('T')[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getArchives(): Promise<{ archived_date: string; player_count: number }[]> {
  const result = await pool.query(`
    SELECT
      archived_date,
      jsonb_array_length(leaderboard) as player_count
    FROM game_archives
    ORDER BY archived_date DESC
  `);

  return result.rows.map(row => ({
    archived_date: row.archived_date.toISOString().split('T')[0],
    player_count: row.player_count,
  }));
}

export async function getArchiveByDate(date: string): Promise<GameArchive | null> {
  const result = await pool.query(
    `SELECT * FROM game_archives WHERE archived_date = $1`,
    [date]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    archived_date: row.archived_date.toISOString().split('T')[0],
  };
}
