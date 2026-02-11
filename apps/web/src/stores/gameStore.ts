import { create } from 'zustand';
import type {
  GameSession,
  ConnectionsGroup,
  CrosswordPuzzle,
  PuzzleType,
} from '@ctg/shared';
import { api, setToken, clearToken } from '../api/client';

interface PlayerInfo {
  id: string;
  name: string;
  city: string;
  instagram: string;
}

interface GameStore {
  // Player
  player: PlayerInfo | null;
  sessionToken: string | null;

  // Schedule
  gameAvailable: boolean;
  gameLocked: boolean;
  serverTime: string | null;

  // Game session
  session: GameSession | null;
  puzzleDate: string | null;

  // Connections state
  connectionsWords: string[];
  selectedWords: string[];
  solvedGroups: ConnectionsGroup[];
  connectionsMistakes: number;
  connectionsFailed: boolean;
  connectionsCompleted: boolean;
  previousGuesses: string[];
  oneAway: boolean;

  // Crossword state
  crosswordPuzzle: CrosswordPuzzle | null;
  crosswordGrid: (string | null)[][];
  crosswordCompleted: boolean;
  crosswordFailed: boolean;
  crosswordAttempts: number;
  cementedCells: { row: number; col: number }[];
  wrongCells: { row: number; col: number }[];

  // Timer
  startedAt: string | null;
  completedAt: string | null;
  serverTimeOffset: number; // ms offset between server and client
  totalTimeMs: number | null;

  // UI
  loading: boolean;
  error: string | null;

  // Actions
  checkSchedule: () => Promise<void>;
  register: (name: string, city: string, instagram: string) => Promise<void>;
  loadGameState: () => Promise<void>;
  startPuzzle: (type: PuzzleType) => Promise<void>;
  selectWord: (word: string) => void;
  deselectWord: (word: string) => void;
  clearSelection: () => void;
  shuffleConnectionsWords: () => void;
  submitConnectionsGuess: () => Promise<{ correct: boolean; failed: boolean; group?: ConnectionsGroup; duplicate?: boolean }>;
  updateCrosswordCell: (row: number, col: number, value: string) => void;
  submitCrossword: () => Promise<{ correct: boolean; completed: boolean; failed?: boolean; totalTimeMs?: number }>;
  giveUpCrossword: () => Promise<void>;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  player: null,
  sessionToken: localStorage.getItem('ctg_session_token'),
  gameAvailable: true,
  gameLocked: false,
  serverTime: null,
  session: null,
  puzzleDate: null,
  connectionsWords: [],
  selectedWords: [],
  solvedGroups: [],
  connectionsMistakes: 0,
  connectionsFailed: false,
  connectionsCompleted: false,
  previousGuesses: [],
  oneAway: false,
  crosswordPuzzle: null,
  crosswordGrid: [],
  crosswordCompleted: false,
  crosswordFailed: false,
  crosswordAttempts: 0,
  cementedCells: [],
  wrongCells: [],
  startedAt: null,
  completedAt: null,
  serverTimeOffset: 0,
  totalTimeMs: null,
  loading: false,
  error: null,

  checkSchedule: async () => {
    try {
      const data = await api.getScheduleStatus();
      const serverMs = new Date(data.server_time).getTime();
      const clientMs = Date.now();
      set({
        gameAvailable: data.game_available,
        gameLocked: data.game_locked,
        serverTime: data.server_time,
        serverTimeOffset: serverMs - clientMs,
      });
    } catch {
      // Silently fail - default to unlocked
      set({ gameAvailable: true, gameLocked: false });
    }
  },

  register: async (name, city, instagram) => {
    set({ loading: true, error: null });
    try {
      const data = await api.register({ name, city, instagram });
      setToken(data.session_token);
      set({
        player: data.player,
        sessionToken: data.session_token,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loadGameState: async () => {
    set({ loading: true });
    try {
      const data = await api.getGameState();
      const serverMs = new Date(data.server_time).getTime();
      const clientMs = Date.now();

      if (data.session) {
        const s = data.session;
        set({
          session: s,
          puzzleDate: data.puzzle_date,
          startedAt: s.started_at,
          completedAt: s.completed_at,
          totalTimeMs: s.total_time_ms,
          solvedGroups: s.connections_state?.solved_groups || [],
          connectionsMistakes: s.connections_state?.mistakes || 0,
          connectionsCompleted: s.connections_completed,
          connectionsFailed: s.connections_state?.failed || false,
          crosswordCompleted: s.crossword_completed,
          crosswordFailed: s.crossword_state?.failed || false,
          crosswordAttempts: s.crossword_state?.attempts || 0,
          cementedCells: s.crossword_state?.cemented_cells || [],
          crosswordGrid: s.crossword_state?.current_grid || [],
          serverTimeOffset: serverMs - clientMs,
          loading: false,
        });
      } else {
        set({
          puzzleDate: data.puzzle_date,
          serverTimeOffset: serverMs - clientMs,
          loading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  startPuzzle: async (type) => {
    set({ loading: true, error: null });
    try {
      const data = await api.startPuzzle(type);
      const serverMs = new Date(data.server_time).getTime();
      const clientMs = Date.now();

      const updates: Partial<GameStore> = {
        startedAt: data.started_at,
        serverTimeOffset: serverMs - clientMs,
        loading: false,
      };

      if (type === 'connections' && data.connections) {
        updates.connectionsWords = data.connections.words;
      }

      if (type === 'crossword' && data.crossword) {
        updates.crosswordPuzzle = data.crossword;
        // Initialize grid if not restored from state
        if (get().crosswordGrid.length === 0) {
          updates.crosswordGrid = data.crossword.grid;
        }
      }

      set(updates as any);
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  selectWord: (word) => {
    const { selectedWords } = get();
    if (selectedWords.length < 4 && !selectedWords.includes(word)) {
      set({ selectedWords: [...selectedWords, word] });
    }
  },

  deselectWord: (word) => {
    set({ selectedWords: get().selectedWords.filter(w => w !== word) });
  },

  clearSelection: () => {
    set({ selectedWords: [] });
  },

  shuffleConnectionsWords: () => {
    const words = [...get().connectionsWords];
    // Fisher-Yates shuffle for unbiased random ordering.
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    set({ connectionsWords: words });
    // Best-effort persistence for this player's session order.
    api.connectionsReorder(words).catch(() => {});
  },

  submitConnectionsGuess: async () => {
    const { selectedWords, previousGuesses } = get();
    if (selectedWords.length !== 4) {
      return { correct: false, failed: false };
    }

    // Check for duplicate guess
    const guessKey = [...selectedWords].map(w => w.toUpperCase()).sort().join('|');
    if (previousGuesses.includes(guessKey)) {
      return { correct: false, failed: false, duplicate: true };
    }

    try {
      const data = await api.connectionsGuess(selectedWords);

      // Track this guess
      set({ previousGuesses: [...previousGuesses, guessKey] });

      if (data.correct && data.group) {
        const { connectionsWords, solvedGroups } = get();
        const solvedWordSet = new Set(data.group.words.map((w: string) => w.toUpperCase()));
        const remainingWords = connectionsWords.filter(
          w => !solvedWordSet.has(w.toUpperCase())
        );

        set({
          solvedGroups: [...solvedGroups, data.group],
          connectionsWords: remainingWords,
          selectedWords: [],
          connectionsCompleted: data.group ? (solvedGroups.length + 1) === 4 : false,
          oneAway: false,
        });

        return { correct: true, failed: false, group: data.group };
      }

      set({
        connectionsMistakes: data.mistakes,
        connectionsFailed: data.failed,
        selectedWords: [],
        oneAway: data.one_away || false,
      });

      return { correct: false, failed: data.failed };
    } catch (err: any) {
      set({ error: err.message });
      return { correct: false, failed: false };
    }
  },

  updateCrosswordCell: (row, col, value) => {
    const { crosswordGrid, cementedCells } = get();
    // Block editing cemented cells
    if (cementedCells.some(c => c.row === row && c.col === col)) return;
    const grid = crosswordGrid.map(r => [...r]);
    if (grid[row] && grid[row][col] !== null) {
      grid[row][col] = value.toUpperCase();
    }
    set({ crosswordGrid: grid, wrongCells: [] });
  },

  submitCrossword: async () => {
    const { crosswordGrid, completedAt: prevCompletedAt, totalTimeMs: prevTotalTimeMs } = get();
    try {
      const data = await api.crosswordSubmit(crosswordGrid);
      if (data.correct) {
        set({
          crosswordCompleted: true,
          wrongCells: [],
          cementedCells: data.correct_cells || [],
          crosswordAttempts: data.attempts,
          // Preserve failure-stop timing when this crossword solve happens after
          // the other puzzle already failed.
          completedAt: data.completed ? new Date().toISOString() : prevCompletedAt,
          totalTimeMs: data.total_time_ms ?? prevTotalTimeMs,
        });
      } else {
        set({
          wrongCells: data.wrong_cells,
          cementedCells: data.correct_cells || [],
          crosswordAttempts: data.attempts,
          crosswordFailed: data.failed || false,
        });
      }
      return {
        correct: data.correct,
        completed: data.completed || false,
        failed: data.failed,
        totalTimeMs: data.total_time_ms,
      };
    } catch (err: any) {
      set({ error: err.message });
      return { correct: false, completed: false };
    }
  },

  giveUpCrossword: async () => {
    try {
      const data = await api.crosswordGiveUp();
      set({
        crosswordFailed: true,
        completedAt: new Date().toISOString(),
        totalTimeMs: data.total_time_ms || null,
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  resetGame: () => {
    clearToken();
    set({
      player: null,
      sessionToken: null,
      session: null,
      connectionsWords: [],
      selectedWords: [],
      solvedGroups: [],
      connectionsMistakes: 0,
      connectionsFailed: false,
      connectionsCompleted: false,
      previousGuesses: [],
      oneAway: false,
      crosswordPuzzle: null,
      crosswordGrid: [],
      crosswordCompleted: false,
      crosswordFailed: false,
      crosswordAttempts: 0,
      cementedCells: [],
      wrongCells: [],
      startedAt: null,
      completedAt: null,
      totalTimeMs: null,
      loading: false,
      error: null,
    });
  },
}));
