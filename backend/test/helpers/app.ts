import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DB, type Db } from '../../src/db/db.module';
import { REDIS } from '../../src/redis/redis.module';

export interface TestApp {
  app: INestApplication;
  http: () => ReturnType<typeof request>;
  db: Db;
  redis: Redis;
  cleanup: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  return {
    app,
    http: () => request(app.getHttpServer()),
    db: app.get<Db>(DB),
    redis: app.get<Redis>(REDIS),
    async cleanup() {
      await app.close();
    },
  };
}
