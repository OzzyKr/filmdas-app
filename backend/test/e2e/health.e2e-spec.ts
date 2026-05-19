import { createTestApp, TestApp } from '../helpers/app';

describe('GET /healthz', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  it('returns 200 with db and redis up', async () => {
    const res = await testApp.http().get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      db: 'up',
      redis: 'up',
    });
    expect(typeof res.body.uptime_s).toBe('number');
  });
});
