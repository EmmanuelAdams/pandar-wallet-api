import request from 'supertest';
import { createApp } from '../../src/app';
import { v4 as uuidv4 } from 'uuid';
import { resetAllStores } from '../../src/store';

const app = createApp();

beforeEach(() => {
  resetAllStores();
});

async function createUserAndGetToken(email?: string): Promise<string> {
  const res = await request(app)
    .post('/user')
    .send({ email: email || `user-${uuidv4()}@test.com` });
  return res.body.data.token;
}

describe('GET /balance', () => {
  it('should return initial balance of 10000', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance).toBe(1000000);
  });

  it('should return 401 without auth header', async () => {
    const res = await request(app).get('/balance');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 with invalid JWT', async () => {
    const res = await request(app)
      .get('/balance')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });

  it('should return 401 with malformed auth header', async () => {
    const res = await request(app)
      .get('/balance')
      .set('Authorization', 'Basic some-token');

    expect(res.status).toBe(401);
  });
});

describe('POST /add_balance', () => {
  it('should add balance correctly', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('credit');
    expect(res.body.data.amount).toBe(5000);
    expect(res.body.data.balanceAfter).toBe(1005000);
    expect(res.body.data).toHaveProperty('reference');
    expect(res.body.data).toHaveProperty('createdAt');
  });

  it('should update balance correctly after multiple deposits', async () => {
    const token = await createUserAndGetToken();

    await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 3000 });

    await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 2000 });

    const balRes = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balRes.body.data.balance).toBe(1005000);
  });

  it('should return 400 for missing idempotency key', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_IDEMPOTENCY_KEY');
  });

  it('should return 400 for amount = 0', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for negative amount', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: -100 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for decimal amount', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 100.5 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for non-numeric amount', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 'abc' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for missing amount', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post('/add_balance')
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 5000 });

    expect(res.status).toBe(401);
  });
});

describe('POST /withdraw', () => {
  it('should withdraw correctly', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 3000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('withdraw');
    expect(res.body.data.amount).toBe(3000);
    expect(res.body.data.balanceAfter).toBe(997000);
  });

  it('should allow withdrawing exact balance', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 1000000 });

    expect(res.status).toBe(200);
    expect(res.body.data.balanceAfter).toBe(0);
  });

  it('should return 400 for insufficient funds', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 2000000 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_FUNDS');
  });

  it('should return 400 when withdrawing from zero balance', async () => {
    const token = await createUserAndGetToken();

    // Withdraw all
    await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 1000000 });

    // Try to withdraw more
    const res = await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_FUNDS');
  });

  it('should return 400 for amount = 0', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for negative amount', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: -500 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for decimal amount', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 100.45 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for missing idempotency key', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_IDEMPOTENCY_KEY');
  });

  it('should not modify balance on failed withdrawal', async () => {
    const token = await createUserAndGetToken();

    await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 2000000 });

    const balRes = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balRes.body.data.balance).toBe(1000000); // Unchanged
  });
});
