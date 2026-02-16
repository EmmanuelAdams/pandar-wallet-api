import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { idempotency } from '../../middleware/idempotency';
import { mutatingLimiter, readLimiter } from '../../middleware/rateLimiter';
import { addBalanceValidation, withdrawValidation } from './wallet.validator';
import { getBalanceHandler, addBalanceHandler, withdrawHandler } from './wallet.controller';

const router = Router();

router.get('/balance', readLimiter, auth, getBalanceHandler);

router.post('/add_balance', mutatingLimiter, auth, idempotency, addBalanceValidation, addBalanceHandler);

router.post('/withdraw', mutatingLimiter, auth, idempotency, withdrawValidation, withdrawHandler);

export { router as walletRouter };
