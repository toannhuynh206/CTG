import { Router, Request, Response } from 'express';
import { isLeaderboardAvailable } from '../services/scheduleService.js';
import { getLeaderboard } from '../services/gameService.js';

const router = Router();

router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    if (!isLeaderboardAvailable()) {
      res.status(403).json({
        error: 'Leaderboard not available yet',
        message: 'The leaderboard will be available at 5pm CT.',
        available: false,
      });
      return;
    }

    const result = await getLeaderboard(date);
    res.json(result);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
