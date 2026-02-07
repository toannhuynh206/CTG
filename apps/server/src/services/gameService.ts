import pool from '../db/pool.js';
import type {
  Player,
  GameSession,
  ConnectionsGroup,
  ConnectionsState,
  CrosswordState,
  PuzzleType,
  RegisterRequest,
  ConnectionsGuessResponse,
  CrosswordCheckResponse,
  CrosswordSubmitResponse,
} from '@ctg/shared';
import { MAX_CONNECTIONS_MISTAKES } from '@ctg/shared';

// ---- Player ----

export async function registerPlayer(data: RegisterRequest): Promise<Player> {
  const { rows } = await pool.query(
    `INSERT INTO players (name, city, instagram)
     VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.city, data.instagram]
  );
  return rows[0];
}

export async function getPlayerByToken(token: string): Promise<Player | null> {
  const { rows } = await pool.query(
    'SELECT * FROM players WHERE session_token = $1',
    [token]
  );
  return rows[0] || null;
}

// ---- Game Session (no puzzle_id needed) ----

export async function getOrCreateSession(playerId: string): Promise<GameSession> {
  // Try to get existing session for this player
  const { rows: existing } = await pool.query(
    'SELECT * FROM game_sessions WHERE player_id = $1',
    [playerId]
  );
  if (existing.length > 0) return existing[0];

  // Create new session (no puzzle_id)
  const { rows } = await pool.query(
    `INSERT INTO game_sessions (player_id)
     VALUES ($1) RETURNING *`,
    [playerId]
  );
  return rows[0];
}

export async function getSession(playerId: string): Promise<GameSession | null> {
  const { rows } = await pool.query(
    'SELECT * FROM game_sessions WHERE player_id = $1',
    [playerId]
  );
  return rows[0] || null;
}

export async function startPuzzle(
  session: GameSession,
  puzzleType: PuzzleType
): Promise<GameSession> {
  const now = new Date().toISOString();

  if (!session.started_at) {
    // First puzzle — start the timer
    const { rows } = await pool.query(
      `UPDATE game_sessions
       SET started_at = $1, first_puzzle = $2
       WHERE id = $3 RETURNING *`,
      [now, puzzleType, session.id]
    );
    return rows[0];
  }

  return session;
}

// ---- Connections ----

export interface PuzzleData {
  connections_data: { groups: ConnectionsGroup[] };
  crossword_data: { grid: (string | null)[][]; size: number; clues: any };
}

export async function processConnectionsGuess(
  session: GameSession,
  puzzleData: PuzzleData,
  guessWords: string[]
): Promise<ConnectionsGuessResponse> {
  const state: ConnectionsState = session.connections_state;

  if (state.failed || state.completed) {
    return { correct: false, mistakes: state.mistakes, failed: state.failed };
  }

  // Normalize guess
  const normalizedGuess = guessWords.map(w => w.toUpperCase()).sort();

  // Check if these words form a group
  const groups: ConnectionsGroup[] = puzzleData.connections_data.groups;
  const solvedLabels = new Set(state.solved_groups.map(g => g.label));

  const matchedGroup = groups.find(g => {
    if (solvedLabels.has(g.label)) return false;
    const groupWords = g.words.map(w => w.toUpperCase()).sort();
    return JSON.stringify(groupWords) === JSON.stringify(normalizedGuess);
  });

  if (matchedGroup) {
    state.solved_groups.push(matchedGroup);
    const completed = state.solved_groups.length === groups.length;
    state.completed = completed;

    const updateFields: string[] = ['connections_state = $1'];
    const params: any[] = [JSON.stringify(state)];

    if (completed) {
      updateFields.push('connections_completed = $' + (params.length + 1));
      params.push(true);
    }

    params.push(session.id);
    await pool.query(
      `UPDATE game_sessions SET ${updateFields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    // Check if both puzzles complete
    if (completed && session.crossword_completed) {
      await completeGame(session.id);
    }

    return { correct: true, group: matchedGroup, mistakes: state.mistakes, failed: false };
  }

  // Wrong guess
  state.mistakes++;
  const failed = state.mistakes >= MAX_CONNECTIONS_MISTAKES;
  state.failed = failed;

  const updateFields = ['connections_state = $1'];
  const params: any[] = [JSON.stringify(state)];

  if (failed) {
    updateFields.push('failed = $' + (params.length + 1));
    params.push(true);

    // Stop the clock when connections fails
    const now = new Date().toISOString();
    updateFields.push('completed_at = $' + (params.length + 1));
    params.push(now);
    updateFields.push('total_time_ms = EXTRACT(EPOCH FROM ($' + (params.length + 1) + '::timestamptz - started_at)) * 1000');
    params.push(now);
  }

  params.push(session.id);
  await pool.query(
    `UPDATE game_sessions SET ${updateFields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );

  return { correct: false, mistakes: state.mistakes, failed };
}

// ---- Crossword ----

export async function checkCrossword(
  puzzleData: PuzzleData,
  playerGrid: (string | null)[][]
): Promise<CrosswordCheckResponse> {
  const answerGrid = puzzleData.crossword_data.grid;
  const wrongCells: { row: number; col: number }[] = [];

  for (let r = 0; r < answerGrid.length; r++) {
    for (let c = 0; c < answerGrid[r].length; c++) {
      if (answerGrid[r][c] === null) continue; // black cell
      const playerVal = playerGrid[r]?.[c]?.toUpperCase() || '';
      const answerVal = (answerGrid[r][c] as string).toUpperCase();
      if (playerVal !== answerVal) {
        wrongCells.push({ row: r, col: c });
      }
    }
  }

  return { correct: wrongCells.length === 0, wrong_cells: wrongCells };
}

export async function submitCrossword(
  session: GameSession,
  puzzleData: PuzzleData,
  playerGrid: (string | null)[][]
): Promise<CrosswordSubmitResponse> {
  const checkResult = await checkCrossword(puzzleData, playerGrid);

  if (!checkResult.correct) {
    // Save their progress
    const crosswordState: CrosswordState = {
      completed: false,
      current_grid: playerGrid,
    };
    await pool.query(
      'UPDATE game_sessions SET crossword_state = $1 WHERE id = $2',
      [JSON.stringify(crosswordState), session.id]
    );

    return { correct: false, wrong_cells: checkResult.wrong_cells, completed: false };
  }

  // Correct!
  const crosswordState: CrosswordState = {
    completed: true,
    current_grid: playerGrid,
  };

  await pool.query(
    `UPDATE game_sessions SET crossword_state = $1, crossword_completed = true WHERE id = $2`,
    [JSON.stringify(crosswordState), session.id]
  );

  // Refresh session
  const { rows } = await pool.query('SELECT * FROM game_sessions WHERE id = $1', [session.id]);
  const updatedSession = rows[0];

  // Check if both puzzles complete
  if (updatedSession.connections_completed && updatedSession.crossword_completed && !updatedSession.failed) {
    const finalSession = await completeGame(session.id);
    return {
      correct: true,
      wrong_cells: [],
      completed: true,
      total_time_ms: finalSession.total_time_ms || undefined,
    };
  }

  return {
    correct: true,
    wrong_cells: [],
    completed: updatedSession.connections_completed && updatedSession.crossword_completed,
  };
}

export async function giveUpCrossword(session: GameSession): Promise<GameSession> {
  const now = new Date();
  const { rows } = await pool.query(
    `UPDATE game_sessions
     SET crossword_state = jsonb_set(jsonb_set(crossword_state, '{completed}', 'false'), '{failed}', 'true'),
         failed = true,
         completed_at = $1,
         total_time_ms = EXTRACT(EPOCH FROM ($1::timestamptz - started_at)) * 1000
     WHERE id = $2
     RETURNING *`,
    [now.toISOString(), session.id]
  );
  return rows[0];
}

async function completeGame(sessionId: string): Promise<GameSession> {
  const now = new Date();
  const { rows } = await pool.query(
    `UPDATE game_sessions
     SET completed_at = $1,
         total_time_ms = EXTRACT(EPOCH FROM ($1::timestamptz - started_at)) * 1000
     WHERE id = $2 AND completed_at IS NULL
     RETURNING *`,
    [now.toISOString(), sessionId]
  );
  return rows[0];
}
