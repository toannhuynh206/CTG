import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { sessionMiddleware } from '../middleware/session.js';
import { gameGate } from '../middleware/gameGate.js';
import { getServerTime } from '../services/scheduleService.js';
import { getCurrentPuzzle } from '../services/currentPuzzleService.js';
import {
  registerPlayer,
  getPlayerByInstagram,
  getOrCreateSession,
  getSession,
  startPuzzle,
  processConnectionsGuess,
  submitCrossword,
  giveUpCrossword,
  updateConnectionsWordOrder,
  PuzzleData,
} from '../services/gameService.js';
import { getGameLocked } from '../services/settingsService.js';
import { US_STATES } from '@ctg/shared';
import type { PuzzleType, ConnectionsGroup } from '@ctg/shared';

const router = Router();

const guessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, slow down' },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many registration attempts, try again later' },
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

// Register player — blocked when game is locked
router.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const { name, city, instagram } = req.body;

    if (!name || !city || !instagram) {
      res.status(400).json({ error: 'Name, city, and instagram are required' });
      return;
    }

    // Input length validation
    if (name.length > 50 || city.length > 50 || instagram.length > 50) {
      res.status(400).json({ error: 'Fields must be 50 characters or less' });
      return;
    }

    // Validate state is from the allowed list
    if (!US_STATES.includes(city)) {
      res.status(400).json({ error: 'Please select a valid state' });
      return;
    }

    // Block registration when game is locked
    const locked = await getGameLocked();
    if (locked) {
      res.status(403).json({ error: 'Registration is closed right now' });
      return;
    }

    // Block duplicate Instagram handles
    const existing = await getPlayerByInstagram(instagram);
    if (existing) {
      res.status(409).json({ error: 'This Instagram handle is already registered' });
      return;
    }

    const player = await registerPlayer({ name, city, instagram });
    if (!player) {
      res.status(409).json({ error: 'This Instagram handle is already registered' });
      return;
    }

    // Create session for this player
    await getOrCreateSession(player.id);

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

// Get game state (for refresh/reconnect) — always allowed for existing sessions
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

// Start a puzzle — blocked when game is locked
router.post('/start-puzzle', gameGate, sessionMiddleware(), async (req: Request, res: Response) => {
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

    // For already-finished puzzles, still return puzzle data so the frontend
    // can render the completed state — just skip starting the timer
    const puzzleDone =
      (puzzle_type === 'connections' && (session.connections_completed || session.connections_state?.failed)) ||
      (puzzle_type === 'crossword' && (session.crossword_completed || session.crossword_state?.failed));

    if (!puzzleDone) {
      session = await startPuzzle(session, puzzle_type);
    }

    const response: any = {
      puzzle_type,
      started_at: session.started_at,
      server_time: getServerTime().toISOString(),
    };

    if (puzzle_type === 'connections') {
      // Build unsolved word list and persist/restore per-player order.
      const allWords: string[] = [];
      puzzleData.connections_data.groups.forEach((g: ConnectionsGroup) => {
        allWords.push(...g.words);
      });

      const solvedWordSet = new Set<string>(
        (session.connections_state?.solved_groups || [])
          .flatMap((g: ConnectionsGroup) => g.words)
          .map((w: string) => w.toUpperCase())
      );
      const unsolvedWords = allWords.filter((w) => !solvedWordSet.has(w.toUpperCase()));

      const storedOrder = (session.connections_state?.word_order || []).filter(
        (w: string) => !solvedWordSet.has(w.toUpperCase())
      );
      const unsolvedSet = new Set(unsolvedWords.map((w) => w.toUpperCase()));
      const storedSet = new Set(storedOrder.map((w: string) => w.toUpperCase()));

      const hasValidStoredOrder =
        storedOrder.length === unsolvedWords.length &&
        storedSet.size === unsolvedSet.size &&
        [...unsolvedSet].every((w) => storedSet.has(w));

      const wordsForPlayer = hasValidStoredOrder ? storedOrder : [...unsolvedWords];

      if (!hasValidStoredOrder) {
        // Fisher-Yates shuffle
        for (let i = wordsForPlayer.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [wordsForPlayer[i], wordsForPlayer[j]] = [wordsForPlayer[j], wordsForPlayer[i]];
        }
        await updateConnectionsWordOrder(session.id, wordsForPlayer);
      }

      response.connections = {
        words: wordsForPlayer,
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

// Connections guess — blocked when game is locked
router.post('/connections/guess', gameGate, guessLimiter, sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { words } = req.body;

    if (!Array.isArray(words) || words.length !== 4) {
      res.status(400).json({ error: 'Must guess exactly 4 words' });
      return;
    }

    // Validate all words are strings
    if (!words.every((w: any) => typeof w === 'string' && w.length <= 100)) {
      res.status(400).json({ error: 'Invalid word format' });
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

    // Block if connections already completed or failed
    if (session.connections_completed || session.connections_state?.failed) {
      res.status(403).json({ error: 'Connections already finished' });
      return;
    }

    const result = await processConnectionsGuess(session, puzzleData, words);
    res.json(result);
  } catch (err) {
    console.error('Connections guess error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Persist player-specific connections tile order
router.post('/connections/reorder', gameGate, sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { words } = req.body;
    if (!Array.isArray(words) || !words.every((w: any) => typeof w === 'string' && w.length <= 100)) {
      res.status(400).json({ error: 'Invalid words format' });
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
    if (session.connections_completed || session.connections_state?.failed) {
      res.status(403).json({ error: 'Connections already finished' });
      return;
    }

    const allWords: string[] = [];
    puzzleData.connections_data.groups.forEach((g: ConnectionsGroup) => allWords.push(...g.words));
    const solvedWordSet = new Set<string>(
      (session.connections_state?.solved_groups || [])
        .flatMap((g: ConnectionsGroup) => g.words)
        .map((w: string) => w.toUpperCase())
    );
    const expected = allWords.filter((w) => !solvedWordSet.has(w.toUpperCase()));
    const expectedSet = new Set(expected.map((w) => w.toUpperCase()));
    const submittedSet = new Set(words.map((w: string) => w.toUpperCase()));

    if (
      words.length !== expected.length ||
      submittedSet.size !== expectedSet.size ||
      [...expectedSet].some((w) => !submittedSet.has(w))
    ) {
      res.status(400).json({ error: 'Words do not match current unsolved set' });
      return;
    }

    await updateConnectionsWordOrder(session.id, words);
    res.json({ success: true });
  } catch (err) {
    console.error('Connections reorder error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crossword submit — blocked when game is locked
router.post('/crossword/submit', gameGate, guessLimiter, sessionMiddleware(), async (req: Request, res: Response) => {
  try {
    const { grid } = req.body;

    if (!Array.isArray(grid)) {
      res.status(400).json({ error: 'Invalid grid format' });
      return;
    }

    const session = await getSession(req.player!.id);
    if (!session || !session.started_at) {
      res.status(400).json({ error: 'Game not started' });
      return;
    }

    // Block if crossword already completed or failed
    if (session.crossword_completed) {
      res.status(403).json({ error: 'Crossword already completed' });
      return;
    }
    if (session.crossword_state?.failed) {
      res.status(403).json({ error: 'No attempts remaining' });
      return;
    }

    const puzzleData = await getPuzzleData();
    if (!puzzleData) {
      res.status(404).json({ error: 'No puzzle available' });
      return;
    }

    const result = await submitCrossword(session, puzzleData, grid);
    res.json(result);
  } catch (err) {
    console.error('Crossword submit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crossword give up — blocked when game is locked
router.post('/crossword/give-up', gameGate, sessionMiddleware(), async (req: Request, res: Response) => {
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
