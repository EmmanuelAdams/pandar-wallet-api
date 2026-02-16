export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Pandar Wallet API',
    version: '1.0.0',
    description:
      'In-memory wallet API with double-entry ledger, JWT authentication, idempotency, and concurrency safety. **All amounts are in kobo** (1 NGN = 100 kobo).',
  },
  servers: [
    {
      url: 'https://pandar-wallet-api.onrender.com',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Invalid request data',
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/user': {
      post: {
        tags: ['User'],
        summary: 'Create a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@abc.xyz',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    email: 'user@abc.xyz',
                    balance: 1000000,
                    token: 'eyJhbGciOiJIUzI1NiIs...',
                    createdAt: '2026-02-16T12:00:00.000Z',
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                example: {
                  success: false,
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Lorem ipsum dolor sit amet',
                  },
                },
              },
            },
          },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/balance': {
      get: {
        tags: ['Wallet'],
        summary: 'Get wallet balance',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Balance retrieved',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: { balance: 1000000 },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/add_balance': {
      post: {
        tags: ['Wallet'],
        summary: 'Add balance to wallet',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'header',
            name: 'Idempotency-Key',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: {
                    type: 'integer',
                    minimum: 1,
                    example: 5000,
                    description: 'Amount in kobo (5000 kobo = ₦50.00)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Balance added',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    type: 'credit',
                    amount: 5000,
                    reference: 'dep_550e8400',
                    balanceAfter: 1005000,
                    createdAt: '2026-02-16T12:00:00.000Z',
                  },
                },
              },
            },
          },
          400: {
            description:
              'Validation error or missing idempotency key',
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/withdraw': {
      post: {
        tags: ['Wallet'],
        summary: 'Withdraw from wallet',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'header',
            name: 'Idempotency-Key',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: {
                    type: 'integer',
                    minimum: 1,
                    example: 1000,
                    description: 'Amount in kobo (1000 kobo = ₦10.00)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Withdrawal successful',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    type: 'withdraw',
                    amount: 1000,
                    reference: 'wth_550e8400',
                    balanceAfter: 999000,
                    createdAt: '2026-02-16T12:00:00.000Z',
                  },
                },
              },
            },
          },
          400: {
            description:
              'Validation error, insufficient funds, or missing idempotency key',
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'Get transaction history',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
        ],
        responses: {
          200: {
            description: 'Transaction history',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    transactions: [
                      {
                        id: '550e8400-e29b-41d4-a716-446655440000',
                        type: 'credit',
                        amount: 1000000,
                        reference: 'initial_550e8400',
                        createdAt:
                          '2026-02-16T12:00:00.000Z',
                      },
                    ],
                    pagination: {
                      page: 1,
                      limit: 20,
                      totalItems: 1,
                      totalPages: 1,
                      hasNextPage: false,
                      hasPrevPage: false,
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};
