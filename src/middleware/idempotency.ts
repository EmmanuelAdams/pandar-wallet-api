import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { idempotencyStore } from '../store';

export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['idempotency-key'];

  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new AppError(400, 'MISSING_IDEMPOTENCY_KEY', 'Idempotency-Key header is required');
  }

  if (key.length > 256) {
    throw new AppError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 256 characters or less');
  }

  const userId = req.userId!;
  const compositeKey = idempotencyStore.buildKey(userId, req.path, key);
  const cached = idempotencyStore.get(compositeKey);

  if (cached) {
    res.status(cached.statusCode).json(cached.body);
    return;
  }

  // Intercept res.json to cache successful responses
  const originalJson = res.json.bind(res);
  res.json = function (body: Record<string, unknown>) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(compositeKey, {
        statusCode: res.statusCode,
        body,
        createdAt: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
}
