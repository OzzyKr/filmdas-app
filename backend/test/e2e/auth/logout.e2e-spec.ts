import { createTestApp, TestApp } from '../../helpers/app';
import { truncateAll } from '../../helpers/truncate';
import { loginAs, signupUser } from './_shared';

describe('POST /auth/logout', () => {
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

  it('returns 204 and clears the session in Redis', async () => {
    const { user } = await signupUser(testApp, { email: 'a@b.com', password: 'Passw0rd' });
    const { token } = await loginAs(testApp, 'a@b.com', 'Passw0rd');

    const res = await testApp.http().post('/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);

    expect(await testApp.redis.get(`sess:${token}`)).toBeNull();
    const members = await testApp.redis.smembers(`user:${user.id}:sessions`);
    expect(members).not.toContain(token);
  });

  it('blocks subsequent /me with the revoked token', async () => {
    await signupUser(testApp, { email: 'a@b.com', password: 'Passw0rd' });
    const { token } = await loginAs(testApp, 'a@b.com', 'Passw0rd');

    await testApp.http().post('/auth/logout').set('Authorization', `Bearer ${token}`);

    const me = await testApp.http().get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
  });

  it('does not invalidate other sessions for the same user', async () => {
    await signupUser(testApp, { email: 'a@b.com', password: 'Passw0rd' });
    const sessionA = await loginAs(testApp, 'a@b.com', 'Passw0rd');
    const sessionB = await loginAs(testApp, 'a@b.com', 'Passw0rd');

    await testApp.http().post('/auth/logout').set('Authorization', `Bearer ${sessionA.token}`);

    const meB = await testApp
      .http()
      .get('/auth/me')
      .set('Authorization', `Bearer ${sessionB.token}`);
    expect(meB.status).toBe(200);
  });

  it('returns 401 without Authorization header', async () => {
    const res = await testApp.http().post('/auth/logout');
    expect(res.status).toBe(401);
  });
});
