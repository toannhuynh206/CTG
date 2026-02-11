// CTA Train Line Colors
export const COLORS = {
  BLUE: '#00A1DE',
  RED: '#C60C30',
  WHITE: '#FFFFFF',
  LIGHT_GRAY: '#2C3039',
  DARK_GRAY: '#F0F1F3',
} as const;

// Connections group colors — CTA line colors (ordered by difficulty 1-4)
export const CONNECTION_COLORS = [
  '#F9E300', // Yellow (Skokie) - easiest
  '#009B3A', // Green (Ashland)
  '#00A1DE', // Blue (O'Hare)
  '#522398', // Purple (Linden) - hardest
] as const;

// Game schedule (Central Time)
export const GAME_START_HOUR = 8;   // 8am CT
export const GAME_END_HOUR = 15;    // 3pm CT
export const LEADERBOARD_HOUR = 17; // 5pm CT
export const GAME_DAY = 1;          // Monday (0=Sunday)

// Game limits
export const MAX_CONNECTIONS_MISTAKES = 4;
export const MAX_CROSSWORD_ATTEMPTS = 3;
export const CONNECTIONS_GROUP_SIZE = 4;
export const CONNECTIONS_NUM_GROUPS = 4;
export const CROSSWORD_SIZE = 5;

// US States
export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'Washington D.C.',
] as const;

// API
export const API_VERSION = 'v1';
