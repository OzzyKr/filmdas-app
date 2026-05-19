import { sql } from 'drizzle-orm';
import { createTestApp, TestApp } from '../../helpers/app';
import { truncateAll } from '../../helpers/truncate';

describe('POST /auth/signup', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  beforeEach(async () => {
    await truncateAll(testApp.db, testApp.redis);
  });

  it('returns 201 with user and no token on valid body', async () => {
    const res = await testApp
      .http()
      .post('/auth/signup')
      .send({ email: 'a@b.com', password: 'Passw0rd', name: 'Aylin' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'a@b.com', name: 'Aylin' });
    expect(res.body.user.id).toEqual(expect.any(String));
    expect(res.body).not.toHaveProperty('token');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('persists password as a hash, not plaintext', async () => {
    await testApp
      .http()
      .post('/auth/signup')
      .send({ email: 'a@b.com', password: 'Passw0rd', name: 'Aylin' });

    const rows = await testApp.db.execute(
      sql`SELECT password_hash FROM users WHERE email = 'a@b.com'`,
    );
    const row = rows[0] as { password_hash: string };
    expect(row.password_hash).not.toBe('Passw0rd');
    expect(row.password_hash.startsWith('$argon2id$')).toBe(true);
  });

  it('creates no Redis session keys (signup does not auto-login)', async () => {
    await testApp
      .http()
      .post('/auth/signup')
      .send({ email: 'a@b.com', password: 'Passw0rd', name: 'Aylin' });

    const sessKeys = await testApp.redis.keys('sess:*');
    expect(sessKeys).toEqual([]);
  });

  it.each([
    ['weak password', { email: 'a@b.com', password: 'short', name: 'A' }],
    ['malformed email', { email: 'not-an-email', password: 'Passw0rd', name: 'A' }],
    ['missing name', { email: 'a@b.com', password: 'Passw0rd', name: '' }],
    ['missing all', {}],
  ])('returns 400 on %s', async (_label, body) => {
    const res = await testApp.http().post('/auth/signup').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email (case-insensitive)', async () => {
    const first = await testApp
      .http()
      .post('/auth/signup')
      .send({ email: 'Foo@Example.com', password: 'Passw0rd', name: 'First' });
    expect(first.status).toBe(201);

    const second = await testApp
      .http()
      .post('/auth/signup')
      .send({ email: 'foo@example.com', password: 'Passw0rd', name: 'Second' });
    expect(second.status).toBe(409);
  });

  it('normalizes email (trim + lowercase) before storing', async () => {
    await testApp
      .http()
      .post('/auth/signup')
      .send({ email: '  Alice@Example.COM  ', password: 'Passw0rd', name: 'Alice' });

    const rows = await testApp.db.execute(sql`SELECT email FROM users`);
    expect((rows[0] as { email: string }).email).toBe('alice@example.com');
  });
});
