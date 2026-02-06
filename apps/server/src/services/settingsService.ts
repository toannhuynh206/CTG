import pool from '../db/pool.js';

export async function getGameLocked(): Promise<boolean> {
  const result = await pool.query(
    `SELECT value FROM game_settings WHERE key = 'game_locked'`
  );
  if (result.rows.length === 0) {
    return false;
  }
  return result.rows[0].value?.locked === true;
}

export async function setGameLocked(locked: boolean): Promise<boolean> {
  await pool.query(
    `UPDATE game_settings SET value = $1, updated_at = NOW() WHERE key = 'game_locked'`,
    [JSON.stringify({ locked })]
  );
  return locked;
}
