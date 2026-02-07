import { Router, Request, Response } from 'express';
import pool from '../db/pool.js';

const router = Router();

// GET /leaderboard — current game's leaderboard
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.name, p.city, p.instagram, gs.total_time_ms, gs.failed,
              gs.connections_completed, gs.crossword_completed, gs.completed_at
       FROM game_sessions gs
       JOIN players p ON p.id = gs.player_id
       WHERE gs.completed_at IS NOT NULL
         AND gs.failed = false
         AND gs.connections_completed = true
         AND gs.crossword_completed = true
       ORDER BY gs.total_time_ms ASC`
    );

    const entries = rows.map((row, i) => ({
      rank: i + 1,
      name: row.name,
      city: row.city,
      instagram: row.instagram,
      total_time_ms: row.total_time_ms,
    }));

    res.json({ entries });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
