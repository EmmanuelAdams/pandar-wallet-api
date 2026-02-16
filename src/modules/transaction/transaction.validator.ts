import { query, ValidationChain } from 'express-validator';
import { config } from '../../config';

export const transactionQueryValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: config.pagination.maxLimit })
    .withMessage(`Limit must be between 1 and ${config.pagination.maxLimit}`),
];
