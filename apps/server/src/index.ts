import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import gameRouter from './routes/game.js';
import leaderboardRouter from './routes/leaderboard.js';
import scheduleRouter from './routes/schedule.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const guessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, slow down' },
});

// Routes
app.use('/api/v1/game', gameRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/schedule', scheduleRouter);
app.use('/api/v1/admin', adminRouter);

// Apply rate limiting to guess endpoints
app.use('/api/v1/game/connections/guess', guessLimiter);
app.use('/api/v1/game/crossword/submit', guessLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CTG Server running on port ${PORT}`);
});
