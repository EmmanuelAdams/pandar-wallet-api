import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { getTransactions } from './transaction.service';
import { config } from '../../config';
import { AppError } from '../../errors/AppError';

export function getTransactionsHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'VALIDATION_ERROR', errors.array()[0].msg);
    }

    const page = parseInt(req.query.page as string, 10) || config.pagination.defaultPage;
    const limit = parseInt(req.query.limit as string, 10) || config.pagination.defaultLimit;

    const result = getTransactions(req.userId!, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
