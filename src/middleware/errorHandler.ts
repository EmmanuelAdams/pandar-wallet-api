import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { config } from '../config';

interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = config.nodeEnv === 'development';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(isDev && { stack: err.stack }),
      },
    });
    return;
  }

  const bodyParserError = err as BodyParserError;
  if (bodyParserError.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        ...(isDev && { stack: err.stack }),
      },
    });
    return;
  }

  if (isDev) {
    console.error('[UNHANDLED ERROR]', err.stack || err);
  }

  res.status(422).json({
    success: false,
    error: {
      code: 'UNPROCESSABLE_ENTITY',
      message: 'The request could not be processed',
      ...(isDev && { stack: err.stack }),
    },
  });
}
