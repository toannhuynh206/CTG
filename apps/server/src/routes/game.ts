import { Router, Request, Response } from 'express';
import { sessionMiddleware } from '../middleware/session.js';
import { gameGate } from '../middleware/gameGate.js';
import { getTodayPuzzleDate, getServerTime } from '../services/scheduleService.js';
import { getPuzzleByDate } from '../services/puzzleService.js';
import {
  registerPlayer,
  getOrCreateSession,
  getSession,
  startPuzzle,
  processConnectionsGuess,
  checkCrossword,
  submitCrossword,
  giveUpCrossword,
} from '../services/gameService.js';
import type { PuzzleType, ConnectionsGroup } from '@ctg/shared';
import { CONNECTION_COLORS } from '@ctg/shared';

const router = Router();

// Register player
router.post('/register', gameGate, async (req: Request, res: Response) => {
  try {
    const { name, city, instagram } = req.body;

    if (!name || !city || !instagram) {
      res.status(400).json({ error: 'Name, city, and instagram are required' });
      return;
    }

    const player = await registerPlayer({ name, city, instagram });

    // Get today's puzzle and create session
    const puzzleDate = getTodayPuzzleDate();
    const puzzle = await getPuzzleByDate(puzzleDate);

    if (!puzzle) {
      res.status(404).json({ error: 'No puzzle available for today' });
      return;
    }

    await getOrCreateSession(player.id, puzzle.id);

    res.json({
      session_token: player.session_token,
      player: {
        id: player.id,
        name: player.name,
        city: player.city,
        instagram: player.instagram,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game state (for refresh/reconnect)
router.get('/state', sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const puzzleDate = getTodayPuzzleDate();
    const puzzle = await getPuzzleByDate(puzzleDate);

    if (!puzzle) {
      res.json({
        session: null,
        server_time: getServerTime().toISOString(),
        puzzle_date: puzzleDate,
      });
      return;
    }

    const session = await getSession(req.player!.id, puzzle.id);

    res.json({
      session,
      server_time: getServerTime().toISOString(),
      puzzle_date: puzzleDate,
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

    const puzzleDate = getTodayPuzzleDate();
    const puzzle = await getPuzzleByDate(puzzleDate);

    if (!puzzle) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    let session = await getOrCreateSession(req.player!.id, puzzle.id);
    session = await startPuzzle(session, puzzle_type);

    const response: any = {
      puzzle_type,
      started_at: session.started_at,
      server_time: getServerTime().toISOString(),
    };

    if (puzzle_type === 'connections') {
      // Shuffle words from all groups, don't send answers
      const allWords: string[] = [];
      puzzle.connections_data.groups.forEach((g: ConnectionsGroup) => {
        allWords.push(...g.words);
      });
      // Fisher-Yates shuffle
      for (let i = allWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
      }
      response.connections = {
        words: allWords,
        num_groups: puzzle.connections_data.groups.length,
      };
    } else {
      // Send crossword without answers
      const crosswordData = puzzle.crossword_data;
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
router.post('/connections/guess', sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { words } = req.body;

    if (!Array.isArray(words) || words.length !== 4) {
      res.status(400).json({ error: 'Must guess exactly 4 words' });
      return;
    }

    const puzzleDate = getTodayPuzzleDate();
    const puzzle = await getPuzzleByDate(puzzleDate);
    if (!puzzle) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    const session = await getSession(req.player!.id, puzzle.id);
    if (!session || !session.started_at) {
      res.status(400).json({ error: 'Game not started' });
      return;
    }

    const result = await processConnectionsGuess(session, puzzle, words);
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

    const puzzleDate = getTodayPuzzleDate();
    const puzzle = await getPuzzleByDate(puzzleDate);
    if (!puzzle) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    const result = await checkCrossword(puzzle, grid);
    res.json(result);
  } catch (err) {
    console.error('Crossword check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crossword submit (final)
router.post('/crossword/submit', sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { grid } = req.body;

    const puzzleDate = getTodayPuzzleDate();
    const puzzle = await getPuzzleByDate(puzzleDate);
    if (!puzzle) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    const session = await getSession(req.player!.id, puzzle.id);
    if (!session || !session.started_at) {
      res.status(400).json({ error: 'Game not started' });
      return;
    }

    const result = await submitCrossword(session, puzzle, grid);
    res.json(result);
  } catch (err) {
    console.error('Crossword submit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crossword give up
router.post('/crossword/give-up', sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const puzzleDate = getTodayPuzzleDate();
    const puzzle = await getPuzzleByDate(puzzleDate);
    if (!puzzle) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    const session = await getSession(req.player!.id, puzzle.id);
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

export default router;
