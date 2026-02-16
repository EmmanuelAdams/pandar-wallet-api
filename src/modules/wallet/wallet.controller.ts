import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import * as walletService from './wallet.service';
import { withLock } from '../../store';
import { AppError } from '../../errors/AppError';

export function getBalanceHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const balance = walletService.getBalance(req.userId!);
    res.json({ success: true, data: { balance } });
  } catch (error) {
    next(error);
  }
}

export async function addBalanceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'VALIDATION_ERROR', errors.array()[0].msg);
    }

    const result = await withLock(req.userId!, async () => {
      return walletService.deposit(req.userId!, parseInt(req.body.amount, 10));
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function withdrawHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'VALIDATION_ERROR', errors.array()[0].msg);
    }

    const result = await withLock(req.userId!, async () => {
      return walletService.withdraw(req.userId!, parseInt(req.body.amount, 10));
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
