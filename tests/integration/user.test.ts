import request from 'supertest';
import { createApp } from '../../src/app';
import { resetAllStores } from '../../src/store';

const app = createApp();

beforeEach(() => {
  resetAllStores();
});

describe('POST /user', () => {
  it('should create a user and return JWT token', async () => {
    const res = await request(app)
      .post('/user')
      .send({ email: 'user@abc.xyz' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.email).toBe('user@abc.xyz');
    expect(res.body.data.balance).toBe(1000000);
    expect(res.body.data).toHaveProperty('createdAt');
  });

  it('should return 409 for duplicate email', async () => {
    await request(app).post('/user').send({ email: 'dup@test.com' });

    const res = await request(app)
      .post('/user')
      .send({ email: 'dup@test.com' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('should return 400 for missing email', async () => {
    const res = await request(app).post('/user').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/user')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for empty email', async () => {
    const res = await request(app)
      .post('/user')
      .send({ email: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for empty body', async () => {
    const res = await request(app)
      .post('/user')
      .send();

    expect(res.status).toBe(400);
  });

  it('should normalize email to lowercase', async () => {
    const res = await request(app)
      .post('/user')
      .send({ email: 'User@ABC.XYZ' });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('user@abc.xyz');
  });

  it('should ignore extra fields in body', async () => {
    const res = await request(app)
      .post('/user')
      .send({ email: 'extra@test.com', name: 'John', age: 30 });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('extra@test.com');
    expect(res.body.data).not.toHaveProperty('name');
    expect(res.body.data).not.toHaveProperty('age');
  });

  it('should record initial balance as a transaction', async () => {
    const userRes = await request(app)
      .post('/user')
      .send({ email: 'txuser@test.com' });

    const token = userRes.body.data.token;

    const txRes = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(txRes.body.data.transactions).toHaveLength(1);
    expect(txRes.body.data.transactions[0].type).toBe('credit');
    expect(txRes.body.data.transactions[0].amount).toBe(1000000);
  });
});
