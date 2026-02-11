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
import { MAX_CONNECTIONS_MISTAKES, MAX_CROSSWORD_ATTEMPTS } from '@ctg/shared';

// ---- Player ----

export async function registerPlayer(data: RegisterRequest): Promise<Player | null> {
  const { rows } = await pool.query(
    `INSERT INTO players (name, city, instagram)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [data.name, data.city, data.instagram]
  );
  return rows[0] || null;
}

export async function getPlayerByToken(token: string): Promise<Player | null> {
  const { rows } = await pool.query(
    'SELECT * FROM players WHERE session_token = $1',
    [token]
  );
  return rows[0] || null;
}

export async function getPlayerByInstagram(instagram: string): Promise<Player | null> {
  const { rows } = await pool.query(
    'SELECT * FROM players WHERE LOWER(instagram) = LOWER($1)',
    [instagram]
  );
  return rows[0] || null;
}

export async function getCurrentPlayers(): Promise<{
  name: string;
  instagram: string;
  status: 'playing' | 'completed' | 'failed';
}[]> {
  const { rows } = await pool.query(`
    SELECT p.name, p.instagram,
      CASE
        WHEN gs.failed = true THEN 'failed'
        WHEN gs.connections_completed = true AND gs.crossword_completed = true THEN 'completed'
        ELSE 'playing'
      END AS status
    FROM players p
    LEFT JOIN game_sessions gs ON gs.player_id = p.id
    ORDER BY p.created_at DESC
  `);
  return rows;
}

// ---- Game Session (no puzzle_id needed) ----

export async function getOrCreateSession(playerId: string): Promise<GameSession> {
  // Atomic upsert — safe against concurrent requests
  const { rows } = await pool.query(
    `INSERT INTO game_sessions (player_id)
     VALUES ($1)
     ON CONFLICT (player_id) DO NOTHING
     RETURNING *`,
    [playerId]
  );
  if (rows.length > 0) return rows[0];

  // Conflict means it already exists — fetch it
  const { rows: existing } = await pool.query(
    'SELECT * FROM game_sessions WHERE player_id = $1',
    [playerId]
  );
  return existing[0];
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
    // First puzzle — start the timer (AND started_at IS NULL prevents race condition)
    const { rows } = await pool.query(
      `UPDATE game_sessions
       SET started_at = $1, first_puzzle = $2
       WHERE id = $3 AND started_at IS NULL
       RETURNING *`,
      [now, puzzleType, session.id]
    );
    // If another request already set started_at, fetch fresh
    if (rows.length === 0) {
      const { rows: fresh } = await pool.query(
        'SELECT * FROM game_sessions WHERE id = $1',
        [session.id]
      );
      return fresh[0];
    }
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row and read fresh state to prevent concurrent guess races
    const { rows: freshRows } = await client.query(
      'SELECT * FROM game_sessions WHERE id = $1 FOR UPDATE',
      [session.id]
    );
    const freshSession = freshRows[0];
    const state: ConnectionsState = freshSession.connections_state;

    if (state.failed || state.completed) {
      await client.query('COMMIT');
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

        // Finalize within the same transaction to avoid races with concurrent give-up requests.
        if (freshSession.crossword_completed && !freshSession.failed && !freshSession.completed_at) {
          const now = new Date().toISOString();
          updateFields.push('completed_at = $' + (params.length + 1));
          params.push(now);
          updateFields.push('total_time_ms = EXTRACT(EPOCH FROM ($' + (params.length + 1) + '::timestamptz - started_at)) * 1000');
          params.push(now);
        }
      }

      params.push(session.id);
      await client.query(
        `UPDATE game_sessions SET ${updateFields.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );

      await client.query('COMMIT');

      return { correct: true, group: matchedGroup, mistakes: state.mistakes, failed: false };
    }

    // Check "one away" — does the guess have 3 of 4 words from any unsolved group?
    let oneAway = false;
    for (const g of groups) {
      if (solvedLabels.has(g.label)) continue;
      const groupWords = g.words.map(w => w.toUpperCase());
      const overlap = normalizedGuess.filter(w => groupWords.includes(w));
      if (overlap.length === 3) {
        oneAway = true;
        break;
      }
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
    await client.query(
      `UPDATE game_sessions SET ${updateFields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    await client.query('COMMIT');
    return { correct: false, mistakes: state.mistakes, failed, one_away: oneAway };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---- Crossword ----

export async function checkCrossword(
  puzzleData: PuzzleData,
  playerGrid: (string | null)[][]
): Promise<CrosswordCheckResponse & { correct_cells: { row: number; col: number }[] }> {
  const answerGrid = puzzleData.crossword_data.grid;
  const wrongCells: { row: number; col: number }[] = [];
  const correctCells: { row: number; col: number }[] = [];

  for (let r = 0; r < answerGrid.length; r++) {
    for (let c = 0; c < answerGrid[r].length; c++) {
      if (answerGrid[r][c] === null) continue; // black cell
      const playerVal = playerGrid[r]?.[c]?.toUpperCase() || '';
      const answerVal = (answerGrid[r][c] as string).toUpperCase();
      if (playerVal !== answerVal) {
        wrongCells.push({ row: r, col: c });
      } else {
        correctCells.push({ row: r, col: c });
      }
    }
  }

  return { correct: wrongCells.length === 0, wrong_cells: wrongCells, correct_cells: correctCells };
}

export async function submitCrossword(
  session: GameSession,
  puzzleData: PuzzleData,
  playerGrid: (string | null)[][]
): Promise<CrosswordSubmitResponse> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row and read fresh state to prevent concurrent submission races
    const { rows: freshRows } = await client.query(
      'SELECT * FROM game_sessions WHERE id = $1 FOR UPDATE',
      [session.id]
    );
    const freshSession = freshRows[0];

    // Idempotency/serialization guard: a concurrent request may have just finished this puzzle.
    if (freshSession.crossword_completed) {
      await client.query('COMMIT');
      return {
        correct: true,
        wrong_cells: [],
        correct_cells: freshSession.crossword_state?.cemented_cells || [],
        completed: !!(freshSession.connections_completed && freshSession.crossword_completed),
        attempts: freshSession.crossword_state?.attempts || 0,
        total_time_ms: freshSession.total_time_ms || undefined,
      };
    }
    if (freshSession.crossword_state?.failed) {
      await client.query('COMMIT');
      return {
        correct: false,
        wrong_cells: [],
        correct_cells: freshSession.crossword_state?.cemented_cells || [],
        completed: false,
        failed: true,
        attempts: freshSession.crossword_state?.attempts || 0,
      };
    }

    const checkResult = await checkCrossword(puzzleData, playerGrid);
    const prevState = freshSession.crossword_state || {};
    const attempts = (prevState.attempts || 0) + 1;
    const prevCemented = prevState.cemented_cells || [];

    if (!checkResult.correct) {
      // Merge newly correct cells with previously cemented ones
      const cementedSet = new Set<string>(prevCemented.map((c: any) => `${c.row}-${c.col}`));
      for (const cell of checkResult.correct_cells) {
        cementedSet.add(`${cell.row}-${cell.col}`);
      }
      const allCemented = Array.from(cementedSet).map((k) => {
        const [row, col] = k.split('-').map(Number);
        return { row, col };
      });

      const failed = attempts >= MAX_CROSSWORD_ATTEMPTS;

      const crosswordState: CrosswordState = {
        completed: false,
        failed,
        attempts,
        cemented_cells: allCemented,
        current_grid: playerGrid,
      };

      if (failed) {
        // Mark game as failed
        const now = new Date();
        await client.query(
          `UPDATE game_sessions
           SET crossword_state = $1, failed = true,
               completed_at = $2,
               total_time_ms = EXTRACT(EPOCH FROM ($2::timestamptz - started_at)) * 1000
           WHERE id = $3`,
          [JSON.stringify(crosswordState), now.toISOString(), session.id]
        );
      } else {
        await client.query(
          'UPDATE game_sessions SET crossword_state = $1 WHERE id = $2',
          [JSON.stringify(crosswordState), session.id]
        );
      }

      await client.query('COMMIT');

      return {
        correct: false,
        wrong_cells: checkResult.wrong_cells,
        correct_cells: allCemented,
        completed: false,
        failed: failed || undefined,
        attempts,
      };
    }

    // Correct!
    const crosswordState: CrosswordState = {
      completed: true,
      attempts,
      cemented_cells: checkResult.correct_cells,
      current_grid: playerGrid,
    };

    await client.query(
      `UPDATE game_sessions SET crossword_state = $1, crossword_completed = true WHERE id = $2`,
      [JSON.stringify(crosswordState), session.id]
    );

    // Read fresh state after update (within the transaction)
    const { rows: updatedRows } = await client.query(
      'SELECT * FROM game_sessions WHERE id = $1',
      [session.id]
    );
    const updatedSession = updatedRows[0];

    // Finalize within the same transaction to avoid races with concurrent give-up requests.
    if (
      updatedSession.connections_completed &&
      updatedSession.crossword_completed &&
      !updatedSession.failed &&
      !updatedSession.completed_at
    ) {
      const now = new Date().toISOString();
      const { rows: finalRows } = await client.query(
        `UPDATE game_sessions
         SET completed_at = $1,
             total_time_ms = EXTRACT(EPOCH FROM ($1::timestamptz - started_at)) * 1000
         WHERE id = $2
         RETURNING *`,
        [now, session.id]
      );
      const finalSession = finalRows[0];

      await client.query('COMMIT');

      return {
        correct: true,
        wrong_cells: [],
        correct_cells: checkResult.correct_cells,
        completed: true,
        attempts,
        total_time_ms: finalSession.total_time_ms || undefined,
      };
    }

    await client.query('COMMIT');

    return {
      correct: true,
      wrong_cells: [],
      correct_cells: checkResult.correct_cells,
      completed: updatedSession.connections_completed && updatedSession.crossword_completed,
      attempts,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function giveUpCrossword(session: GameSession): Promise<GameSession> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: lockedRows } = await client.query(
      'SELECT * FROM game_sessions WHERE id = $1 FOR UPDATE',
      [session.id]
    );
    const fresh = lockedRows[0];
    if (!fresh) {
      await client.query('ROLLBACK');
      throw new Error('Session not found');
    }

    if (fresh.completed_at || fresh.crossword_completed || fresh.crossword_state?.failed) {
      await client.query('COMMIT');
      return fresh;
    }

    const now = new Date().toISOString();
    const { rows } = await client.query(
      `UPDATE game_sessions
       SET crossword_state = jsonb_set(jsonb_set(crossword_state, '{completed}', 'false'), '{failed}', 'true'),
           failed = true,
           completed_at = $1,
           total_time_ms = EXTRACT(EPOCH FROM ($1::timestamptz - started_at)) * 1000
       WHERE id = $2
       RETURNING *`,
      [now, session.id]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateConnectionsWordOrder(sessionId: string, wordOrder: string[]): Promise<void> {
  await pool.query(
    `UPDATE game_sessions
     SET connections_state = jsonb_set(connections_state, '{word_order}', $1::jsonb, true)
     WHERE id = $2`,
    [JSON.stringify(wordOrder), sessionId]
  );
}
