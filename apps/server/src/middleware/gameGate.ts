import { Request, Response, NextFunction } from 'express';
import { isGameAvailable } from '../services/scheduleService.js';

export function gameGate(req: Request, res: Response, next: NextFunction) {
  if (!isGameAvailable()) {
    res.status(403).json({
      error: 'Game is not available right now',
      message: 'The game is only available on Mondays from 8am to 3pm CT.',
    });
    return;
  }
  next();
}
