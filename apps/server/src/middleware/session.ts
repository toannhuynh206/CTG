import { Request, Response, NextFunction } from 'express';
import { getPlayerByToken } from '../services/gameService.js';
import type { Player } from '@ctg/shared';

declare global {
  namespace Express {
    interface Request {
      player?: Player;
    }
  }
}

export function sessionMiddleware(required = true) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const headerValue = req.headers['x-session-token'];
      const token = typeof headerValue === 'string' ? headerValue : '';

      if (!token) {
        if (required) {
          res.status(401).json({ error: 'Session token required' });
          return;
        }
        next();
        return;
      }

      const player = await getPlayerByToken(token);
      if (!player) {
        if (required) {
          res.status(401).json({ error: 'Invalid session token' });
          return;
        }
        next();
        return;
      }

      req.player = player;
      next();
    } catch (err) {
      next(err);
    }
  };
}
