import { Request, Response, NextFunction } from 'express';
import { getGameLockStatus } from '../services/settingsService.js';

export async function gameGate(req: Request, res: Response, next: NextFunction) {
  const locked = await getGameLockStatus();

  if (locked) {
    res.status(403).json({
      error: 'Game is not available right now',
      message: 'The game is currently locked. Check back later!',
    });
    return;
  }
  next();
}
