import pool from '../db/pool.js';

export interface CurrentPuzzle {
  connections_data: any | null;
  crossword_data: any | null;
  updated_at: string;
}

export async function getCurrentPuzzle(): Promise<CurrentPuzzle> {
  const result = await pool.query(
    `SELECT connections_data, crossword_data, updated_at FROM current_puzzle WHERE id = 1`
  );
  return result.rows[0] || { connections_data: null, crossword_data: null, updated_at: new Date().toISOString() };
}

export async function setCurrentConnections(connectionsData: any): Promise<void> {
  await pool.query(
    `UPDATE current_puzzle SET connections_data = $1, updated_at = NOW() WHERE id = 1`,
    [JSON.stringify(connectionsData)]
  );
}

export async function setCurrentCrossword(crosswordData: any): Promise<void> {
  await pool.query(
    `UPDATE current_puzzle SET crossword_data = $1, updated_at = NOW() WHERE id = 1`,
    [JSON.stringify(crosswordData)]
  );
}

export async function clearCurrentPuzzle(): Promise<void> {
  await pool.query(
    `UPDATE current_puzzle SET connections_data = NULL, crossword_data = NULL, updated_at = NOW() WHERE id = 1`
  );
}
