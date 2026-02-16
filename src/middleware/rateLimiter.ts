import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

const isTest = config.nodeEnv === 'test';

// Passthrough middleware for test environment
const passthrough = (_req: Request, _res: Response, next: NextFunction) => next();

export const mutatingLimiter = isTest ? passthrough : rateLimit({
  windowMs: config.rateLimit.mutating.windowMs,
  max: config.rateLimit.mutating.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

export const readLimiter = isTest ? passthrough : rateLimit({
  windowMs: config.rateLimit.read.windowMs,
  max: config.rateLimit.read.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
