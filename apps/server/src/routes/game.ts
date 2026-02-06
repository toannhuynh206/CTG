import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { sessionMiddleware } from '../middleware/session.js';
import { getServerTime } from '../services/scheduleService.js';
import { getCurrentPuzzle } from '../services/currentPuzzleService.js';
import {
  registerPlayer,
  getOrCreateSession,
  getSession,
  startPuzzle,
  processConnectionsGuess,
  checkCrossword,
  submitCrossword,
  giveUpCrossword,
  PuzzleData,
} from '../services/gameService.js';
import type { PuzzleType, ConnectionsGroup } from '@ctg/shared';

const router = Router();

const guessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, slow down' },
});

// Helper to get current puzzle data
async function getPuzzleData(): Promise<PuzzleData | null> {
  const current = await getCurrentPuzzle();
  if (!current.connections_data || !current.crossword_data) {
    return null;
  }
  return {
    connections_data: current.connections_data,
    crossword_data: current.crossword_data,
  };
}

// Register player (always allowed - game availability checked on frontend)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, city, instagram } = req.body;

    if (!name || !city || !instagram) {
      res.status(400).json({ error: 'Name, city, and instagram are required' });
      return;
    }

    const player = await registerPlayer({ name, city, instagram });

    // Create session for this player
    await getOrCreateSession(player.id);

    // Check if game is currently playable
    const { getGameLocked } = await import('../services/settingsService.js');
    const locked = await getGameLocked();
    const puzzleData = await getPuzzleData();
    const gameAvailable = !locked && puzzleData !== null;

    res.json({
      session_token: player.session_token,
      player: {
        id: player.id,
        name: player.name,
        city: player.city,
        instagram: player.instagram,
      },
      game_available: gameAvailable,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game state (for refresh/reconnect)
router.get('/state', sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const session = await getSession(req.player!.id);

    res.json({
      session,
      server_time: getServerTime().toISOString(),
    });
  } catch (err) {
    console.error('Get state error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start a puzzle
router.post('/start-puzzle', sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { puzzle_type } = req.body as { puzzle_type: PuzzleType };

    if (!puzzle_type || !['connections', 'crossword'].includes(puzzle_type)) {
      res.status(400).json({ error: 'Invalid puzzle_type' });
      return;
    }

    const puzzleData = await getPuzzleData();
    if (!puzzleData) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    let session = await getOrCreateSession(req.player!.id);
    session = await startPuzzle(session, puzzle_type);

    const response: any = {
      puzzle_type,
      started_at: session.started_at,
      server_time: getServerTime().toISOString(),
    };

    if (puzzle_type === 'connections') {
      // Shuffle words from all groups, don't send answers
      const allWords: string[] = [];
      puzzleData.connections_data.groups.forEach((g: ConnectionsGroup) => {
        allWords.push(...g.words);
      });
      // Fisher-Yates shuffle
      for (let i = allWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
      }
      response.connections = {
        words: allWords,
        num_groups: puzzleData.connections_data.groups.length,
      };
    } else {
      // Send crossword without answers
      const crosswordData = puzzleData.crossword_data;
      // Create empty grid (keep null for black cells)
      const emptyGrid = crosswordData.grid.map((row: (string | null)[]) =>
        row.map((cell: string | null) => (cell === null ? null : ''))
      );

      response.crossword = {
        size: crosswordData.size,
        grid: emptyGrid,
        clues: {
          across: crosswordData.clues.across.map((c: any) => ({
            number: c.number,
            clue: c.clue,
            row: c.row,
            col: c.col,
            direction: c.direction,
          })),
          down: crosswordData.clues.down.map((c: any) => ({
            number: c.number,
            clue: c.clue,
            row: c.row,
            col: c.col,
            direction: c.direction,
          })),
        },
      };
    }

    res.json(response);
  } catch (err) {
    console.error('Start puzzle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connections guess
router.post('/connections/guess', guessLimiter, sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { words } = req.body;

    if (!Array.isArray(words) || words.length !== 4) {
      res.status(400).json({ error: 'Must guess exactly 4 words' });
      return;
    }

    const puzzleData = await getPuzzleData();
    if (!puzzleData) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    const session = await getSession(req.player!.id);
    if (!session || !session.started_at) {
      res.status(400).json({ error: 'Game not started' });
      return;
    }

    const result = await processConnectionsGuess(session, puzzleData, words);
    res.json(result);
  } catch (err) {
    console.error('Connections guess error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crossword check (non-final)
router.post('/crossword/check', sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { grid } = req.body;

    const puzzleData = await getPuzzleData();
    if (!puzzleData) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    const result = await checkCrossword(puzzleData, grid);
    res.json(result);
  } catch (err) {
    console.error('Crossword check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crossword submit (final)
router.post('/crossword/submit', guessLimiter, sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { grid } = req.body;

    const puzzleData = await getPuzzleData();
    if (!puzzleData) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    const session = await getSession(req.player!.id);
    if (!session || !session.started_at) {
      res.status(400).json({ error: 'Game not started' });
      return;
    }

    const result = await submitCrossword(session, puzzleData, grid);
    res.json(result);
  } catch (err) {
    console.error('Crossword submit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crossword give up
router.post('/crossword/give-up', sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const session = await getSession(req.player!.id);
    if (!session || !session.started_at) {
      res.status(400).json({ error: 'Game not started' });
      return;
    }

    if (session.completed_at) {
      res.status(400).json({ error: 'Game already finished' });
      return;
    }

    const updated = await giveUpCrossword(session);
    res.json({
      gave_up: true,
      total_time_ms: updated.total_time_ms,
    });
  } catch (err) {
    console.error('Crossword give up error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DEV ONLY: Auto-complete a puzzle for testing
router.post('/dev-complete', sessionMiddleware(), async (req: Request, res: Response) => {
  if (process.env.DEV_MODE !== 'true') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  try {
    const { puzzle_type } = req.body as { puzzle_type: PuzzleType };

    const puzzleData = await getPuzzleData();
    if (!puzzleData) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    let session = await getOrCreateSession(req.player!.id);
    session = await startPuzzle(session, puzzle_type);

    if (puzzle_type === 'connections') {
      // Auto-solve all connection groups in order
      const groups: ConnectionsGroup[] = puzzleData.connections_data.groups;
      for (const group of groups) {
        session = await getSession(req.player!.id) as any;
        await processConnectionsGuess(session, puzzleData, group.words);
      }
      res.json({ success: true, puzzle_type: 'connections' });
    } else {
      // Auto-submit the correct crossword grid
      session = await getSession(req.player!.id) as any;
      const result = await submitCrossword(session, puzzleData, puzzleData.crossword_data.grid);
      res.json({ success: true, puzzle_type: 'crossword', ...result });
    }
  } catch (err) {
    console.error('Dev complete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
