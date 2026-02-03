import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import gameRouter from './routes/game.js';
import leaderboardRouter from './routes/leaderboard.js';
import scheduleRouter from './routes/schedule.js';
import adminRouter from './routes/admin.js';
import { getTodayPuzzleDate, isLeaderboardAvailable } from './services/scheduleService.js';
import { generateLeaderboardSnapshot } from './services/gameService.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/v1/game', gameRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/schedule', scheduleRouter);
app.use('/api/v1/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Leaderboard snapshot cron — checks every 60s, generates snapshot at 5pm CT
let snapshotGenerated = '';
setInterval(async () => {
  try {
    const today = getTodayPuzzleDate();
    if (isLeaderboardAvailable() && snapshotGenerated !== today) {
      console.log(`Generating leaderboard snapshot for ${today}`);
      await generateLeaderboardSnapshot(today);
      snapshotGenerated = today;
      console.log(`Leaderboard snapshot generated for ${today}`);
    }
  } catch (err) {
    console.error('Leaderboard snapshot cron error:', err);
  }
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`CTG Server running on port ${PORT}`);
});
