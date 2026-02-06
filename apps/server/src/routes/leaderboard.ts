import { Router, Request, Response } from 'express';
import { getArchiveByDate } from '../services/archiveService.js';

const router = Router();

router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    // Get leaderboard from archive
    const archive = await getArchiveByDate(date);

    if (!archive) {
      res.status(404).json({
        error: 'No leaderboard found for this date',
        available: false,
      });
      return;
    }

    res.json({
      date,
      entries: archive.leaderboard,
      available: true,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
