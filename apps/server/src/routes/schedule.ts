import { Router } from 'express';
import { getServerTime } from '../services/scheduleService.js';
import { getGameLocked } from '../services/settingsService.js';
import { getCurrentPuzzle } from '../services/currentPuzzleService.js';

const router = Router();

router.get('/status', async (_req, res) => {
  try {
    const gameLocked = await getGameLocked();
    const currentPuzzle = await getCurrentPuzzle();
    const hasPuzzle = currentPuzzle.connections_data !== null && currentPuzzle.crossword_data !== null;

    // Game is available only if not locked AND puzzle exists
    const gameAvailable = !gameLocked && hasPuzzle;
    const serverTime = getServerTime();

    res.json({
      game_available: gameAvailable,
      game_locked: gameLocked,
      has_puzzle: hasPuzzle,
      server_time: serverTime.toISOString(),
    });
  } catch (err) {
    console.error('Schedule status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
