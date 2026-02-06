import { Router, Request, Response } from 'express';
import { getGameLocked, setGameLocked } from '../services/settingsService.js';
import {
  getCurrentPuzzle,
  setCurrentConnections,
  setCurrentCrossword,
} from '../services/currentPuzzleService.js';
import {
  archiveCurrentGame,
  getArchives,
  getArchiveByDate,
} from '../services/archiveService.js';

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

// Get game lock status
router.get('/lock', requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const locked = await getGameLocked();
    res.json({ locked });
  } catch (err) {
    console.error('Admin get lock error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set game lock status
router.post('/lock', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const { locked } = req.body;
    if (typeof locked !== 'boolean') {
      res.status(400).json({ error: 'locked must be a boolean' });
      return;
    }
    const newStatus = await setGameLocked(locked);
    res.json({ success: true, locked: newStatus });
  } catch (err) {
    console.error('Admin set lock error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current puzzle
router.get('/current-puzzle', requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const puzzle = await getCurrentPuzzle();
    res.json({ puzzle });
  } catch (err) {
    console.error('Admin get current puzzle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set current connections
router.post('/current-puzzle/connections', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const { connections_data } = req.body;
    if (!connections_data) {
      res.status(400).json({ error: 'connections_data is required' });
      return;
    }
    await setCurrentConnections(connections_data);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin set connections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set current crossword
router.post('/current-puzzle/crossword', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const { crossword_data } = req.body;
    if (!crossword_data) {
      res.status(400).json({ error: 'crossword_data is required' });
      return;
    }
    await setCurrentCrossword(crossword_data);
    res.json({ success: true });
  } catch (err) {
    console.error('Admin set crossword error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Archive current game
router.post('/archive', requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const archive = await archiveCurrentGame();
    res.json({ success: true, archive });
  } catch (err: any) {
    console.error('Admin archive error:', err);
    res.status(400).json({ error: err.message || 'Failed to archive' });
  }
});

// Get all archives
router.get('/archives', requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const archives = await getArchives();
    res.json({ archives });
  } catch (err) {
    console.error('Admin get archives error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get archive by date
router.get('/archives/:date', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const archive = await getArchiveByDate(req.params.date);
    if (!archive) {
      res.status(404).json({ error: 'Archive not found' });
      return;
    }
    res.json({ archive });
  } catch (err) {
    console.error('Admin get archive error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
