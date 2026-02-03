import pool from '../db/pool.js';
import type { Puzzle, CreatePuzzleRequest } from '@ctg/shared';

export async function getPuzzleByDate(date: string): Promise<Puzzle | null> {
  const { rows } = await pool.query(
    'SELECT * FROM puzzles WHERE date = $1',
    [date]
  );
  return rows[0] || null;
}

export async function createPuzzle(data: CreatePuzzleRequest): Promise<Puzzle> {
  const { rows } = await pool.query(
    `INSERT INTO puzzles (date, connections_data, crossword_data)
     VALUES ($1, $2, $3)
     ON CONFLICT (date) DO UPDATE SET
       connections_data = EXCLUDED.connections_data,
       crossword_data = EXCLUDED.crossword_data
     RETURNING *`,
    [data.date, JSON.stringify(data.connections), JSON.stringify(data.crossword)]
  );
  return rows[0];
}
