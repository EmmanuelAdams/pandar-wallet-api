import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../errors/AppError';
import { userStore } from '../store';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function auth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyToken(token);

    if (!payload.sub) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token payload');
    }

    if (!userStore.has(payload.sub)) {
      throw new AppError(401, 'UNAUTHORIZED', 'User not found');
    }

    req.userId = payload.sub;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
}
