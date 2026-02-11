import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { getGameLocked, setGameLocked } from '../services/settingsService.js';
import {
  getCurrentPuzzle,
  setCurrentConnections,
  setCurrentCrossword,
} from '../services/currentPuzzleService.js';
import {
  archiveCurrentGame,
  getArchives,
  getArchiveById,
} from '../services/archiveService.js';
import { getCurrentPlayers } from '../services/gameService.js';
import { CONNECTIONS_GROUP_SIZE, CONNECTIONS_NUM_GROUPS, CROSSWORD_SIZE } from '@ctg/shared';

const router = Router();
const ADMIN_TOKEN_TTL_SECONDS = parseInt(process.env.ADMIN_TOKEN_TTL_SECONDS || '7200', 10);
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many admin login attempts, try again later' },
});

function getAdminSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_API_KEY || 'dev-admin-session-secret';
}

function makeAdminToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + ADMIN_TOKEN_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAdminSessionSecret())
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', getAdminSessionSecret())
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== 'number') return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function validateConnectionsData(input: unknown) {
  if (!isObject(input) || !Array.isArray(input.groups) || input.groups.length !== CONNECTIONS_NUM_GROUPS) {
    throw new Error(`connections_data.groups must contain exactly ${CONNECTIONS_NUM_GROUPS} groups`);
  }

  const normalizedGroups = input.groups.map((rawGroup, index) => {
    if (!isObject(rawGroup)) {
      throw new Error(`Group ${index + 1} has invalid format`);
    }

    const label = String(rawGroup.label || '').trim();
    if (!label || label.length > 80) {
      throw new Error(`Group ${index + 1} label must be 1-80 characters`);
    }

    if (!Array.isArray(rawGroup.words) || rawGroup.words.length !== CONNECTIONS_GROUP_SIZE) {
      throw new Error(`Group ${index + 1} must have exactly ${CONNECTIONS_GROUP_SIZE} words`);
    }

    const words = rawGroup.words.map((word, wordIndex) => {
      const cleaned = String(word || '').trim().toUpperCase();
      if (!cleaned || cleaned.length > 40) {
        throw new Error(`Group ${index + 1} word ${wordIndex + 1} must be 1-40 characters`);
      }
      return cleaned;
    });

    const difficulty = Number(rawGroup.difficulty);
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > CONNECTIONS_NUM_GROUPS) {
      throw new Error(`Group ${index + 1} difficulty must be 1-${CONNECTIONS_NUM_GROUPS}`);
    }

    const color = String(rawGroup.color || '').trim();
    if (color.length > 32) {
      throw new Error(`Group ${index + 1} color is too long`);
    }

    return { label, words, difficulty, color };
  });

  const seen = new Set<string>();
  for (const group of normalizedGroups) {
    for (const word of group.words) {
      if (seen.has(word)) {
        throw new Error(`Duplicate connections word: ${word}`);
      }
      seen.add(word);
    }
  }

  return { groups: normalizedGroups };
}

function validateCrosswordData(input: unknown) {
  if (!isObject(input) || Number(input.size) !== CROSSWORD_SIZE) {
    throw new Error(`crossword_data.size must be ${CROSSWORD_SIZE}`);
  }
  if (!Array.isArray(input.grid) || input.grid.length !== CROSSWORD_SIZE) {
    throw new Error(`crossword_data.grid must have ${CROSSWORD_SIZE} rows`);
  }

  const normalizedGrid = input.grid.map((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== CROSSWORD_SIZE) {
      throw new Error(`Grid row ${rowIndex + 1} must have ${CROSSWORD_SIZE} columns`);
    }
    return row.map((cell, colIndex) => {
      if (cell === null) return null;
      const cleaned = String(cell || '').trim().toUpperCase();
      if (!/^[A-Z]$/.test(cleaned)) {
        throw new Error(`Grid cell (${rowIndex + 1}, ${colIndex + 1}) must be null or a single letter`);
      }
      return cleaned;
    });
  });

  if (!isObject(input.clues) || !Array.isArray(input.clues.across) || !Array.isArray(input.clues.down)) {
    throw new Error('crossword_data.clues must include across and down arrays');
  }

  const normalizeClues = (clues: unknown[], direction: 'across' | 'down') =>
    clues.map((clue, index) => {
      if (!isObject(clue)) {
        throw new Error(`${direction} clue ${index + 1} has invalid format`);
      }
      const number = Number(clue.number);
      const row = Number(clue.row);
      const col = Number(clue.col);
      const text = String(clue.clue || '').trim();

      if (!Number.isInteger(number) || number < 1) {
        throw new Error(`${direction} clue ${index + 1} must have a positive number`);
      }
      if (!Number.isInteger(row) || row < 0 || row >= CROSSWORD_SIZE || !Number.isInteger(col) || col < 0 || col >= CROSSWORD_SIZE) {
        throw new Error(`${direction} clue ${index + 1} has invalid coordinates`);
      }
      if (!text || text.length > 200) {
        throw new Error(`${direction} clue ${index + 1} text must be 1-200 characters`);
      }
      if (clue.direction !== direction) {
        throw new Error(`${direction} clue ${index + 1} has incorrect direction`);
      }

      const normalized: Record<string, unknown> = {
        number,
        clue: text,
        row,
        col,
        direction,
      };

      if (typeof clue.answer === 'string') {
        const answer = clue.answer.trim().toUpperCase();
        if (!answer || answer.length > CROSSWORD_SIZE || !/^[A-Z]+$/.test(answer)) {
          throw new Error(`${direction} clue ${index + 1} answer is invalid`);
        }
        normalized.answer = answer;
      }

      return normalized;
    });

  const across = normalizeClues(input.clues.across, 'across');
  const down = normalizeClues(input.clues.down, 'down');
  if (across.length === 0 && down.length === 0) {
    throw new Error('Crossword must have at least one clue');
  }

  return {
    size: CROSSWORD_SIZE,
    grid: normalizedGrid,
    clues: { across, down },
  };
}

// Login — validates the admin key and returns it for the client to store
router.post('/login', adminLoginLimiter, (req: Request, res: Response) => {
  const { password } = req.body;
  if (typeof password !== 'string' || !password || password !== process.env.ADMIN_API_KEY) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }
  const adminToken = makeAdminToken();
  res.json({ success: true, admin_token: adminToken, expires_in: ADMIN_TOKEN_TTL_SECONDS });
});

// API key protection for all other routes
function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const headerValue = req.headers['x-admin-key'];
  const rawToken = typeof headerValue === 'string' ? headerValue : '';
  const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;

  if (!token || !verifyAdminToken(token)) {
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
    const { connections_data } = req.body as { connections_data?: unknown };
    if (connections_data === undefined) {
      res.status(400).json({ error: 'connections_data is required' });
      return;
    }
    const validated = validateConnectionsData(connections_data);
    await setCurrentConnections(validated);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Admin set connections error:', err);
    res.status(400).json({ error: err.message || 'Invalid connections data' });
  }
});

// Set current crossword
router.post('/current-puzzle/crossword', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const { crossword_data } = req.body as { crossword_data?: unknown };
    if (crossword_data === undefined) {
      res.status(400).json({ error: 'crossword_data is required' });
      return;
    }
    const validated = validateCrosswordData(crossword_data);
    await setCurrentCrossword(validated);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Admin set crossword error:', err);
    res.status(400).json({ error: err.message || 'Invalid crossword data' });
  }
});

// Get current players
router.get('/players', requireAdminKey, async (_req: Request, res: Response) => {
  try {
    const players = await getCurrentPlayers();
    res.json({ players });
  } catch (err) {
    console.error('Admin get players error:', err);
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

// Get archive by id
router.get('/archives/:id', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const archive = await getArchiveById(req.params.id);
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
