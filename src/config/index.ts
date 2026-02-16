import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  nodeEnv: process.env.NODE_ENV || 'development',
  initialBalance: 1000000, // 10,000 NGN = 1,000,000 kobo
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
  rateLimit: {
    mutating: {
      windowMs: parseInt(process.env.RATE_LIMIT_MUTATING_WINDOW_MS || '60000', 10),
      max: parseInt(process.env.RATE_LIMIT_MUTATING_MAX || '30', 10),
    },
    read: {
      windowMs: parseInt(process.env.RATE_LIMIT_READ_WINDOW_MS || '60000', 10),
      max: parseInt(process.env.RATE_LIMIT_READ_MAX || '100', 10),
    },
  },
};
