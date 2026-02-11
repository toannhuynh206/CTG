// ---- Player ----
export interface Player {
  id: string;
  name: string;
  city: string;
  instagram: string;
  session_token: string;
  created_at: string;
}

export interface RegisterRequest {
  name: string;
  city: string;
  instagram: string;
}

export interface RegisterResponse {
  session_token: string;
  player: Pick<Player, 'id' | 'name' | 'city' | 'instagram'>;
}

// ---- Connections ----
export interface ConnectionsGroup {
  label: string;
  words: string[];
  difficulty: number; // 1-4
  color: string;
}

export interface ConnectionsPuzzle {
  groups: ConnectionsGroup[];
}

export interface ConnectionsGuessRequest {
  words: string[];
}

export interface ConnectionsGuessResponse {
  correct: boolean;
  group?: ConnectionsGroup;
  mistakes: number;
  failed: boolean;
  already_solved?: boolean;
  one_away?: boolean;
}

// ---- Crossword ----
export interface CrosswordClue {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

export interface CrosswordPuzzle {
  size: number;
  grid: (string | null)[][]; // null = black cell
  clues: {
    across: Omit<CrosswordClue, 'answer'>[];
    down: Omit<CrosswordClue, 'answer'>[];
  };
}

export interface CrosswordCheckRequest {
  grid: (string | null)[][];
}

export interface CrosswordCheckResponse {
  correct: boolean;
  wrong_cells: { row: number; col: number }[];
}

export interface CrosswordSubmitRequest {
  grid: (string | null)[][];
}

export interface CrosswordSubmitResponse {
  correct: boolean;
  wrong_cells: { row: number; col: number }[];
  correct_cells: { row: number; col: number }[];
  completed: boolean;
  failed?: boolean;
  attempts: number;
  total_time_ms?: number;
}

// ---- Game Session ----
export type PuzzleType = 'connections' | 'crossword';

export interface ConnectionsState {
  solved_groups: ConnectionsGroup[];
  mistakes: number;
  failed: boolean;
  completed: boolean;
  word_order?: string[];
}

export interface CrosswordState {
  completed: boolean;
  failed?: boolean;
  attempts?: number;
  cemented_cells?: { row: number; col: number }[];
  current_grid?: (string | null)[][];
}

export interface GameSession {
  id: string;
  player_id: string;
  puzzle_id: string;
  started_at: string | null;
  completed_at: string | null;
  first_puzzle: PuzzleType | null;
  connections_state: ConnectionsState;
  crossword_state: CrosswordState;
  connections_completed: boolean;
  crossword_completed: boolean;
  total_time_ms: number | null;
  failed: boolean;
}

export interface GameStateResponse {
  session: GameSession | null;
  server_time: string;
  puzzle_date: string;
}

export interface StartPuzzleRequest {
  puzzle_type: PuzzleType;
}

export interface StartPuzzleResponse {
  puzzle_type: PuzzleType;
  started_at: string;
  server_time: string;
  connections?: {
    words: string[];
    num_groups: number;
  };
  crossword?: CrosswordPuzzle;
}

// ---- Puzzle ----
export interface Puzzle {
  id: string;
  date: string;
  connections_data: ConnectionsPuzzle;
  crossword_data: {
    size: number;
    grid: (string | null)[][];
    clues: {
      across: CrosswordClue[];
      down: CrosswordClue[];
    };
  };
  created_at: string;
}

// ---- Leaderboard ----
export interface LeaderboardEntry {
  rank: number;
  name: string;
  city: string;
  instagram: string;
  total_time_ms: number;
}

export interface LeaderboardResponse {
  date: string;
  entries: LeaderboardEntry[];
  available: boolean;
}

// ---- Schedule ----
export interface ScheduleStatus {
  game_available: boolean;
  server_time: string;
  next_game_start: string | null;
  game_end_time: string | null;
  leaderboard_time: string | null;
}

// ---- Admin ----
export interface CreatePuzzleRequest {
  date: string;
  connections: ConnectionsPuzzle;
  crossword: {
    size: number;
    grid: (string | null)[][];
    clues: {
      across: CrosswordClue[];
      down: CrosswordClue[];
    };
  };
}
