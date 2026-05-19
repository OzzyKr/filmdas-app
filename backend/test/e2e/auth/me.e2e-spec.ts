import { createTestApp, TestApp } from '../../helpers/app';
import { truncateAll } from '../../helpers/truncate';
import { signupAndLogin } from './_shared';

describe('GET /auth/me', () => {
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

  it('returns 200 with the current user (no passwordHash) for a valid token', async () => {
    const { token, user } = await signupAndLogin(testApp, { email: 'a@b.com' });

    const res = await testApp.http().get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'a@b.com', id: user.id });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('returns 401 without an Authorization header', async () => {
    const res = await testApp.http().get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed Authorization header', async () => {
    const res = await testApp.http().get('/auth/me').set('Authorization', 'not-a-bearer-token');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an unknown token', async () => {
    const res = await testApp
      .http()
      .get('/auth/me')
      .set('Authorization', 'Bearer sess_doesnotexist');
    expect(res.status).toBe(401);
  });

  it('returns 401 after the session is manually deleted from Redis', async () => {
    const { token } = await signupAndLogin(testApp, { email: 'a@b.com' });
    await testApp.redis.del(`sess:${token}`);

    const res = await testApp.http().get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('refreshes the session TTL on each authed request (sliding window)', async () => {
    const { token } = await signupAndLogin(testApp, { email: 'a@b.com' });
    const THIRTY_DAYS = 60 * 60 * 24 * 30;

    await testApp.redis.expire(`sess:${token}`, 60 * 60); // 1h
    const before = await testApp.redis.ttl(`sess:${token}`);
    expect(before).toBeLessThanOrEqual(60 * 60);

    await testApp.http().get('/auth/me').set('Authorization', `Bearer ${token}`);

    const after = await testApp.redis.ttl(`sess:${token}`);
    expect(after).toBeGreaterThan(THIRTY_DAYS - 60); // within a minute of full TTL
  });
});
