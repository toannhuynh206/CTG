import { Router, Request, Response } from 'express';
import { createPuzzle, getPuzzleByDate } from '../services/puzzleService.js';
import { generateLeaderboardSnapshot } from '../services/gameService.js';

const router = Router();

// Login — validates the admin key and returns it for the client to store
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_API_KEY) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }
  res.json({ success: true, admin_key: password });
});

// API key protection for all other routes
function requireAdminKey(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-admin-key'] as string;
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    res.status(401).json({ error: 'Invalid admin key' });
    return;
  }
  next();
}

// Get puzzle for a date
router.get('/puzzle/:date', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const puzzle = await getPuzzleByDate(req.params.date);
    res.json({ puzzle });
  } catch (err) {
    console.error('Admin get puzzle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/update puzzle
router.post('/puzzle', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const puzzle = await createPuzzle(req.body);
    res.json({ success: true, puzzle });
  } catch (err) {
    console.error('Admin create puzzle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trigger leaderboard snapshot
router.post('/leaderboard/snapshot/:date', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const rankings = await generateLeaderboardSnapshot(req.params.date);
    res.json({ success: true, rankings });
  } catch (err) {
    console.error('Admin leaderboard snapshot error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
