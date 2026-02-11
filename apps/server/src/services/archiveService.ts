import pool from '../db/pool.js';

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
    // Serialize archive jobs so concurrent clicks cannot archive/clear the same game twice.
    await client.query('SELECT pg_advisory_xact_lock($1)', [970001]);

    // Read current puzzle inside this transaction and lock the single row.
    const currentResult = await client.query(
      `SELECT connections_data, crossword_data FROM current_puzzle WHERE id = 1 FOR UPDATE`
    );
    const currentPuzzle = currentResult.rows[0];

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

    // Insert archive as a new row every time.
    const archiveResult = await client.query(`
      INSERT INTO game_archives (archived_date, connections_data, crossword_data, leaderboard)
      VALUES ($1, $2, $3, $4)
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

export async function getArchives(): Promise<{ id: string; archived_date: string; created_at: string; player_count: number }[]> {
  const result = await pool.query(`
    SELECT
      id,
      archived_date,
      created_at,
      jsonb_array_length(leaderboard) as player_count
    FROM game_archives
    ORDER BY created_at DESC, archived_date DESC
  `);

  return result.rows.map(row => ({
    id: row.id,
    archived_date: row.archived_date.toISOString().split('T')[0],
    created_at: row.created_at.toISOString(),
    player_count: row.player_count,
  }));
}

export async function getArchiveById(id: string): Promise<GameArchive | null> {
  const result = await pool.query(
    `SELECT * FROM game_archives WHERE id = $1`,
    [id]
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
