import request from 'supertest';
import { createApp } from '../../src/app';
import { v4 as uuidv4 } from 'uuid';
import { ledgerStore } from '../../src/store/ledgerStore';
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

describe('Concurrency Safety', () => {
  it('should handle 10 concurrent withdrawals correctly (balance never goes negative)', async () => {
    const token = await createUserAndGetToken();
    // Balance is 1,000,000 kobo, attempt 10 withdrawals of 200,000 each
    // Only 5 should succeed

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app)
          .post('/withdraw')
          .set('Authorization', `Bearer ${token}`)
          .set('Idempotency-Key', uuidv4())
          .send({ amount: 200000 })
      )
    );

    const successes = results.filter((r) => r.status === 200);
    const failures = results.filter((r) => r.status === 400);

    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(5);

    failures.forEach((r) => {
      expect(r.body.error.code).toBe('INSUFFICIENT_FUNDS');
    });

    // Verify final balance is exactly 0
    const balRes = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balRes.body.data.balance).toBe(0);
  });

  it('should maintain ledger integrity after concurrent operations', async () => {
    const token = await createUserAndGetToken();

    await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app)
          .post('/withdraw')
          .set('Authorization', `Bearer ${token}`)
          .set('Idempotency-Key', uuidv4())
          .send({ amount: 1000 })
      )
    );

    expect(ledgerStore.verifyLedgerIntegrity()).toBe(true);
  });

  it('should handle concurrent deposits correctly', async () => {
    const token = await createUserAndGetToken();

    // 5 concurrent deposits of 1000 each
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app)
          .post('/add_balance')
          .set('Authorization', `Bearer ${token}`)
          .set('Idempotency-Key', uuidv4())
          .send({ amount: 1000 })
      )
    );

    // All should succeed
    results.forEach((r) => {
      expect(r.status).toBe(200);
    });

    const balRes = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balRes.body.data.balance).toBe(1005000); // 10000 + 5 * 1000
    expect(ledgerStore.verifyLedgerIntegrity()).toBe(true);
  });

  it('should handle mixed concurrent deposits and withdrawals', async () => {
    const token = await createUserAndGetToken();

    // 3 deposits of 2000 and 3 withdrawals of 2000 concurrently
    const operations = [
      ...Array.from({ length: 3 }, () =>
        request(app)
          .post('/add_balance')
          .set('Authorization', `Bearer ${token}`)
          .set('Idempotency-Key', uuidv4())
          .send({ amount: 2000 })
      ),
      ...Array.from({ length: 3 }, () =>
        request(app)
          .post('/withdraw')
          .set('Authorization', `Bearer ${token}`)
          .set('Idempotency-Key', uuidv4())
          .send({ amount: 2000 })
      ),
    ];

    const results = await Promise.all(operations);

    const depositSuccesses = results.slice(0, 3).filter((r) => r.status === 200);
    expect(depositSuccesses).toHaveLength(3); // All deposits succeed

    // Verify ledger integrity regardless of withdrawal results
    expect(ledgerStore.verifyLedgerIntegrity()).toBe(true);

    // Verify balance is never negative
    const balRes = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balRes.body.data.balance).toBeGreaterThanOrEqual(0);
  });

  it('should not interfere between different users', async () => {
    const token1 = await createUserAndGetToken();
    const token2 = await createUserAndGetToken();

    // Concurrent operations on different users
    const results = await Promise.all([
      request(app)
        .post('/withdraw')
        .set('Authorization', `Bearer ${token1}`)
        .set('Idempotency-Key', uuidv4())
        .send({ amount: 5000 }),
      request(app)
        .post('/withdraw')
        .set('Authorization', `Bearer ${token2}`)
        .set('Idempotency-Key', uuidv4())
        .send({ amount: 5000 }),
    ]);

    // Both should succeed independently
    expect(results[0].status).toBe(200);
    expect(results[1].status).toBe(200);

    const bal1 = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token1}`);
    const bal2 = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token2}`);

    expect(bal1.body.data.balance).toBe(995000);
    expect(bal2.body.data.balance).toBe(995000);
    expect(ledgerStore.verifyLedgerIntegrity()).toBe(true);
  });

  it('should ensure atomic transaction - no partial state on failure', async () => {
    const token = await createUserAndGetToken();

    // Try to withdraw more than balance
    await request(app)
      .post('/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', uuidv4())
      .send({ amount: 2000000 });

    // Balance should be unchanged
    const balRes = await request(app)
      .get('/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balRes.body.data.balance).toBe(1000000);
    expect(ledgerStore.verifyLedgerIntegrity()).toBe(true);
  });
});
