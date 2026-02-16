import { body, ValidationChain } from 'express-validator';

export const addBalanceValidation: ValidationChain[] = [
  body('amount')
    .exists({ checkNull: true })
    .withMessage('Amount is required')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer'),
];

export const withdrawValidation: ValidationChain[] = [
  body('amount')
    .exists({ checkNull: true })
    .withMessage('Amount is required')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer'),
];
