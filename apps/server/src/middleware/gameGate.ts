import { Request, Response, NextFunction } from 'express';
import { getGameLocked } from '../services/settingsService.js';

export async function gameGate(req: Request, res: Response, next: NextFunction) {
  try {
    const locked = await getGameLocked();

    if (locked) {
      res.status(403).json({
        error: 'Game is not available right now',
        message: 'The game is currently locked. Check back later!',
      });
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
