import { Router } from 'express';
import {
  isGameAvailable,
  getServerTime,
  getNextGameStart,
  getGameEndTime,
  getLeaderboardTime,
} from '../services/scheduleService.js';

const router = Router();

router.get('/status', (_req, res) => {
  const gameAvailable = isGameAvailable();
  const serverTime = getServerTime();
  const nextGameStart = getNextGameStart();
  const gameEndTime = getGameEndTime();
  const leaderboardTime = getLeaderboardTime();

  res.json({
    game_available: gameAvailable,
    server_time: serverTime.toISOString(),
    next_game_start: nextGameStart?.toISOString() || null,
    game_end_time: gameEndTime?.toISOString() || null,
    leaderboard_time: leaderboardTime?.toISOString() || null,
  });
});

export default router;
