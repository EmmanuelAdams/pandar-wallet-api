# Pandar Wallet API

In-memory wallet API with Node.js, Express, and TypeScript.

**Important:** All amounts are in **kobo** (the smallest unit of Nigerian Naira). 1 NGN = 100 kobo.

- To deposit ₦50.00, send `amount: 5000` (5000 kobo)
- Initial balance is 1,000,000 kobo = ₦10,000.00

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The server runs at `http://localhost:3000`. Swagger docs are at `http://localhost:3000/api-docs`.

## Running Tests

```bash
npm test
npm run test:coverage
```

## API Endpoints

### POST /user

```bash
curl -X POST http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -d '{"email": "user@abc.xyz"}'
```

Returns a JWT token and the user's initial balance of 1,000,000 kobo (₦10,000.00).

### GET /balance

```bash
curl http://localhost:3000/balance \
  -H "Authorization: Bearer <token>"
```

### POST /add_balance

```bash
curl -X POST http://localhost:3000/add_balance \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: unique-key-123" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}'  # 5000 kobo = ₦50.00
```

### POST /withdraw

```bash
curl -X POST http://localhost:3000/withdraw \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: unique-key-456" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'  # 1000 kobo = ₦10.00
```

### GET /transactions

```bash
curl "http://localhost:3000/transactions?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | - | Secret for JWT signing |
| `JWT_EXPIRES_IN` | `24h` | Token expiration |
| `NODE_ENV` | `development` | Environment |
| `RATE_LIMIT_MUTATING_MAX` | `30` | Max mutating requests per window |
| `RATE_LIMIT_MUTATING_WINDOW_MS` | `60000` | Mutating rate limit window (ms) |
| `RATE_LIMIT_READ_MAX` | `100` | Max read requests per window |
| `RATE_LIMIT_READ_WINDOW_MS` | `60000` | Read rate limit window (ms) |
