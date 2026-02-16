import { Router } from 'express';
import { mutatingLimiter } from '../../middleware/rateLimiter';
import { createUserValidation } from './user.validator';
import { createUserHandler } from './user.controller';

const router = Router();

router.post('/user', mutatingLimiter, createUserValidation, createUserHandler);

export { router as userRouter };
