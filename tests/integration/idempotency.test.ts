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

describe('Idempotency', () => {
  describe('POST /add_balance', () => {
    it('should return cached response for duplicate idempotency key', async () => {
      const token = await createUserAndGetToken();
      const key = uuidv4();

      const res1 = await request(app)
        .post('/add_balance')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ amount: 5000 });

      const res2 = await request(app)
        .post('/add_balance')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ amount: 5000 });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body).toEqual(res2.body);

      // Balance should only increase once
      const balRes = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${token}`);

      expect(balRes.body.data.balance).toBe(1005000); // 10000 + 5000 (not 20000)
    });

    it('should process different idempotency keys independently', async () => {
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

      expect(balRes.body.data.balance).toBe(1005000); // 10000 + 3000 + 2000
    });

    it('should allow same idempotency key for different users', async () => {
      const token1 = await createUserAndGetToken();
      const token2 = await createUserAndGetToken();
      const key = uuidv4();

      await request(app)
        .post('/add_balance')
        .set('Authorization', `Bearer ${token1}`)
        .set('Idempotency-Key', key)
        .send({ amount: 5000 });

      await request(app)
        .post('/add_balance')
        .set('Authorization', `Bearer ${token2}`)
        .set('Idempotency-Key', key)
        .send({ amount: 5000 });

      const bal1 = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${token1}`);

      const bal2 = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${token2}`);

      expect(bal1.body.data.balance).toBe(1005000);
      expect(bal2.body.data.balance).toBe(1005000);
    });
  });

  describe('POST /withdraw', () => {
    it('should return cached response for duplicate idempotency key', async () => {
      const token = await createUserAndGetToken();
      const key = uuidv4();

      const res1 = await request(app)
        .post('/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ amount: 2000 });

      const res2 = await request(app)
        .post('/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ amount: 2000 });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body).toEqual(res2.body);

      const balRes = await request(app)
        .get('/balance')
        .set('Authorization', `Bearer ${token}`);

      expect(balRes.body.data.balance).toBe(998000); // Only one withdrawal
    });
  });

  describe('Error cases', () => {
    it('should return 400 for missing Idempotency-Key on add_balance', async () => {
      const token = await createUserAndGetToken();

      const res = await request(app)
        .post('/add_balance')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 5000 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_IDEMPOTENCY_KEY');
    });

    it('should return 400 for empty Idempotency-Key', async () => {
      const token = await createUserAndGetToken();

      const res = await request(app)
        .post('/add_balance')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', '')
        .send({ amount: 5000 });

      expect(res.status).toBe(400);
    });

    it('should not cache failed requests', async () => {
      const token = await createUserAndGetToken();
      const key = uuidv4();

      // First: fail (insufficient funds)
      const res1 = await request(app)
        .post('/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ amount: 2000000 });

      expect(res1.status).toBe(400);

      // Add more balance
      await request(app)
        .post('/add_balance')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', uuidv4())
        .send({ amount: 2000000 });

      // Retry with same key - should process (not return cached failure)
      const res2 = await request(app)
        .post('/withdraw')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ amount: 2000000 });

      expect(res2.status).toBe(200);
    });
  });
});
