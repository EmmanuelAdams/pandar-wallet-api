import { body, ValidationChain } from 'express-validator';

export const createUserValidation: ValidationChain[] = [
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .isLength({ max: 254 })
    .withMessage('Email must be 254 characters or less')
    .normalizeEmail(),
];
