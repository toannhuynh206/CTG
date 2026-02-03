import { GAME_START_HOUR, GAME_END_HOUR, LEADERBOARD_HOUR, GAME_DAY } from '@ctg/shared';

const DEV_MODE = process.env.DEV_MODE === 'true';

function getCentralTime(): Date {
  const now = new Date();
  const ct = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return ct;
}

export function getServerTime(): Date {
  return new Date();
}

export function isGameDay(): boolean {
  if (DEV_MODE) return true;
  const ct = getCentralTime();
  return ct.getDay() === GAME_DAY;
}

export function isGameAvailable(): boolean {
  if (DEV_MODE) return true;
  const ct = getCentralTime();
  if (ct.getDay() !== GAME_DAY) return false;
  const hour = ct.getHours();
  return hour >= GAME_START_HOUR && hour < GAME_END_HOUR;
}

export function isLeaderboardAvailable(): boolean {
  if (DEV_MODE) return true;
  const ct = getCentralTime();
  if (ct.getDay() !== GAME_DAY) {
    return ct.getDay() > GAME_DAY || ct.getDay() === 0;
  }
  return ct.getHours() >= LEADERBOARD_HOUR;
}

export function getTodayPuzzleDate(): string {
  const ct = getCentralTime();
  const year = ct.getFullYear();
  const month = String(ct.getMonth() + 1).padStart(2, '0');
  const day = String(ct.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextGameStart(): Date | null {
  const ct = getCentralTime();
  const dayOfWeek = ct.getDay();

  // Calculate days until next Monday
  let daysUntilMonday: number;
  if (dayOfWeek === GAME_DAY) {
    if (ct.getHours() < GAME_START_HOUR) {
      daysUntilMonday = 0; // Today, hasn't started yet
    } else {
      daysUntilMonday = 7; // Next Monday
    }
  } else {
    daysUntilMonday = (GAME_DAY - dayOfWeek + 7) % 7;
    if (daysUntilMonday === 0) daysUntilMonday = 7;
  }

  const next = new Date(ct);
  next.setDate(next.getDate() + daysUntilMonday);
  next.setHours(GAME_START_HOUR, 0, 0, 0);
  return next;
}

export function getGameEndTime(): Date | null {
  if (!isGameDay()) return null;
  const ct = getCentralTime();
  const end = new Date(ct);
  end.setHours(GAME_END_HOUR, 0, 0, 0);
  return end;
}

export function getLeaderboardTime(): Date | null {
  if (!isGameDay()) return null;
  const ct = getCentralTime();
  const lb = new Date(ct);
  lb.setHours(LEADERBOARD_HOUR, 0, 0, 0);
  return lb;
}
