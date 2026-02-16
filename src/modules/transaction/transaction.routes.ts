import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { readLimiter } from '../../middleware/rateLimiter';
import { transactionQueryValidation } from './transaction.validator';
import { getTransactionsHandler } from './transaction.controller';

const router = Router();

router.get('/transactions', readLimiter, auth, transactionQueryValidation, getTransactionsHandler);

export { router as transactionRouter };
