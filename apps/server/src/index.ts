import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

import gameRouter from './routes/game.js';
import leaderboardRouter from './routes/leaderboard.js';
import scheduleRouter from './routes/schedule.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5180')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS origin denied'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Routes
app.use('/api/v1/game', gameRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/schedule', scheduleRouter);
app.use('/api/v1/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`CTG Server running on port ${PORT}`);
});
