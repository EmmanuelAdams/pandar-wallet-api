import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { createUser } from './user.service';
import { AppError } from '../../errors/AppError';

export function createUserHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'VALIDATION_ERROR', errors.array()[0].msg);
    }

    const result = createUser(req.body.email);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
