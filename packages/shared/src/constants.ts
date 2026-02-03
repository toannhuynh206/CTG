// Chicago Cubs colors
export const COLORS = {
  BLUE: '#0E3386',
  RED: '#CC3433',
  WHITE: '#FFFFFF',
  LIGHT_GRAY: '#F5F5F5',
  DARK_GRAY: '#333333',
} as const;

// Connections group colors (ordered by difficulty 1-4)
export const CONNECTION_COLORS = [
  '#F9DF6D', // Yellow - easiest
  '#A0C35A', // Green
  '#B0C4EF', // Blue
  '#BA81C5', // Purple - hardest
] as const;

// Game schedule (Central Time)
export const GAME_START_HOUR = 8;   // 8am CT
export const GAME_END_HOUR = 15;    // 3pm CT
export const LEADERBOARD_HOUR = 17; // 5pm CT
export const GAME_DAY = 1;          // Monday (0=Sunday)

// Game limits
export const MAX_CONNECTIONS_MISTAKES = 4;
export const CONNECTIONS_GROUP_SIZE = 4;
export const CONNECTIONS_NUM_GROUPS = 4;
export const CROSSWORD_SIZE = 5;

// API
export const API_VERSION = 'v1';
