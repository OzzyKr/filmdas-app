import { createTestApp, TestApp } from '../../helpers/app';
import { truncateAll } from '../../helpers/truncate';
import { signupUser } from './_shared';

describe('POST /auth/login', () => {
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

  it('returns 200 with user + token on valid creds', async () => {
    await signupUser(testApp, { email: 'a@b.com', password: 'Passw0rd', name: 'Aylin' });

    const res = await testApp
      .http()
      .post('/auth/login')
      .send({ email: 'a@b.com', password: 'Passw0rd' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'a@b.com', name: 'Aylin' });
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.startsWith('sess_')).toBe(true);
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('creates a Redis session under sess:<token> and adds to user SET', async () => {
    const { user } = await signupUser(testApp, { email: 'a@b.com' });

    const res = await testApp
      .http()
      .post('/auth/login')
      .send({ email: 'a@b.com', password: 'Passw0rd' });
    const token = res.body.token as string;

    const sessRaw = await testApp.redis.get(`sess:${token}`);
    expect(sessRaw).not.toBeNull();
    expect(JSON.parse(sessRaw as string)).toMatchObject({ userId: user.id });

    const members = await testApp.redis.smembers(`user:${user.id}:sessions`);
    expect(members).toContain(token);
  });

  it('returns 401 with same body for wrong password and unknown email (no enumeration)', async () => {
    await signupUser(testApp, { email: 'a@b.com', password: 'Passw0rd' });

    const wrongPw = await testApp
      .http()
      .post('/auth/login')
      .send({ email: 'a@b.com', password: 'WrongPw9' });
    const unknownEmail = await testApp
      .http()
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'WrongPw9' });

    expect(wrongPw.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPw.body).toEqual(unknownEmail.body);
  });

  it('allows multi-device: prior token survives a new login', async () => {
    await signupUser(testApp, { email: 'a@b.com', password: 'Passw0rd' });
    const first = await testApp
      .http()
      .post('/auth/login')
      .send({ email: 'a@b.com', password: 'Passw0rd' });
    const firstToken = first.body.token as string;

    await testApp.http().post('/auth/login').send({ email: 'a@b.com', password: 'Passw0rd' });

    const me = await testApp.http().get('/auth/me').set('Authorization', `Bearer ${firstToken}`);
    expect(me.status).toBe(200);
  });

  it('returns 429 after 5 attempts from the same IP (varying email)', async () => {
    const ip = '10.20.30.40';
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await testApp
        .http()
        .post('/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: `nobody${i}@example.com`, password: 'WrongPw9' });
      codes.push(res.status);
    }
    expect(codes.slice(0, 5).every((c) => c === 401)).toBe(true);
    expect(codes[5]).toBe(429);
  });

  it('returns 429 after 5 attempts for the same email (varying IP)', async () => {
    await signupUser(testApp, { email: 'victim@example.com', password: 'Passw0rd' });
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await testApp
        .http()
        .post('/auth/login')
        .set('X-Forwarded-For', `10.0.0.${i + 1}`)
        .send({ email: 'victim@example.com', password: 'WrongPw9' });
      codes.push(res.status);
    }
    expect(codes.slice(0, 5).every((c) => c === 401)).toBe(true);
    expect(codes[5]).toBe(429);
  });
});
