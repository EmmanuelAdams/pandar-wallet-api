import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { userRouter } from './modules/user/user.routes';
import { walletRouter } from './modules/wallet/wallet.routes';
import { transactionRouter } from './modules/transaction/transaction.routes';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './swagger';

export function createApp() {
  const app = express();

  app.use(express.json());

  // Swagger docs
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec),
  );

  // Welcome
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Welcome to the Pandar Wallet API',
        docs: '/api-docs',
      },
    });
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Routes
  app.use(userRouter);
  app.use(walletRouter);
  app.use(transactionRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${_req.method} ${_req.path} not found`,
      },
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
