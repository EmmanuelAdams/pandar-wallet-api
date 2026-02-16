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

describe('GET /transactions', () => {
  it('should return initial credit transaction after user creation', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactions).toHaveLength(1);

    const tx = res.body.data.transactions[0];
    expect(tx.type).toBe('credit');
    expect(tx.amount).toBe(1000000);
    expect(tx).toHaveProperty('reference');
    expect(tx).toHaveProperty('createdAt');
    expect(tx).toHaveProperty('id');
  });

  it('should return transactions in most recent first order', async () => {
    const token = await createUserAndGetToken();

    await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 5000 });

    await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 2000 });

    const res = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.transactions).toHaveLength(3);
    expect(res.body.data.transactions[0].type).toBe('withdraw');
    expect(res.body.data.transactions[1].type).toBe('credit');
    expect(res.body.data.transactions[2].type).toBe('credit'); // Initial deposit
  });

  it('should paginate correctly', async () => {
    const token = await createUserAndGetToken();

    // Create 5 more transactions (6 total with initial)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/add_balance')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', uuidv4())
        .send({ amount: 1000 });
    }

    // Page 1 with limit 3
    const page1 = await request(app)
      .get('/transactions?page=1&limit=3')
      .set('Authorization', `Bearer ${token}`);

    expect(page1.body.data.transactions).toHaveLength(3);
    expect(page1.body.data.pagination).toEqual({
      page: 1,
      limit: 3,
      totalItems: 6,
      totalPages: 2,
      hasNextPage: true,
      hasPrevPage: false,
    });

    // Page 2
    const page2 = await request(app)
      .get('/transactions?page=2&limit=3')
      .set('Authorization', `Bearer ${token}`);

    expect(page2.body.data.transactions).toHaveLength(3);
    expect(page2.body.data.pagination.hasNextPage).toBe(false);
    expect(page2.body.data.pagination.hasPrevPage).toBe(true);
  });

  it('should return empty array for page beyond last', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .get('/transactions?page=100&limit=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(0);
  });

  it('should respect custom limit parameter', async () => {
    const token = await createUserAndGetToken();

    await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 1000 });

    const res = await request(app)
      .get('/transactions?limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.transactions).toHaveLength(1);
    expect(res.body.data.pagination.totalItems).toBe(2);
  });

  it('should return 400 for invalid page parameter', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .get('/transactions?page=-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid limit parameter', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .get('/transactions?limit=0')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for limit exceeding maximum', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .get('/transactions?limit=200')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/transactions');
    expect(res.status).toBe(401);
  });

  it('should use correct transaction types (credit | withdraw)', async () => {
    const token = await createUserAndGetToken();

    await request(app)
      .post('/add_balance')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 5000 });

    await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 2000 });

    const res = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    const types = res.body.data.transactions.map((t: { type: string }) => t.type);
    types.forEach((type: string) => {
      expect(['credit', 'withdraw']).toContain(type);
    });
  });

  it('should have valid ISO timestamp on all transactions', async () => {
    const token = await createUserAndGetToken();

    const res = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    res.body.data.transactions.forEach((tx: { createdAt: string }) => {
      expect(new Date(tx.createdAt).toISOString()).toBe(tx.createdAt);
    });
  });
});
