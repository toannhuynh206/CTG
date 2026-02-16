import { Router, Request, Response } from 'express';
import pool from '../db/pool.js';
import { getGameLocked } from '../services/settingsService.js';
import { sessionMiddleware } from '../middleware/session.js';
import { getSession } from '../services/gameService.js';

const router = Router();

// GET /leaderboard — visible to finished players or when game is locked
router.get('/', sessionMiddleware(false), async (req: Request, res: Response) => {
  try {
    const locked = await getGameLocked();
    let playerFinished = false;

    // Check if this player has finished both puzzles
    if (req.player) {
      const session = await getSession(req.player.id);
      if (session) {
        const connDone = session.connections_completed || session.connections_state?.failed;
        const crossDone = session.crossword_completed || session.crossword_state?.failed;
        playerFinished = !!(connDone && crossDone);
      }
    }

    // Show leaderboard if game is locked OR player has finished
    if (!locked && !playerFinished) {
      res.json({ entries: [], hidden: true, message: 'Finish both puzzles to see the leaderboard' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT p.id AS player_id, p.name, p.city, p.instagram,
              gs.total_time_ms, gs.failed,
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

    // Find current player's entry (by player id)
    let yourEntry = null;
    if (req.player) {
      const idx = rows.findIndex(r => r.player_id === req.player!.id);
      if (idx !== -1) {
        yourEntry = {
          rank: idx + 1,
          name: rows[idx].name,
          total_time_ms: rows[idx].total_time_ms,
        };
      }
    }

    res.json({ entries, yourEntry });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
