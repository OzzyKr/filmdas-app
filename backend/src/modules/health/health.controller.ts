import { Controller, Get, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import Redis from 'ioredis';
import { DB, type Db } from '../../db/db.module';
import { REDIS } from '../../redis/redis.module';

@Controller('healthz')
export class HealthController {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [dbOk, redisOk] = await Promise.all([
      this.db
        .execute(sql`select 1`)
        .then(() => true)
        .catch(() => false),
      this.redis
        .ping()
        .then((reply) => reply === 'PONG')
        .catch(() => false),
    ]);

    const ok = dbOk && redisOk;
    const body = {
      status: ok ? 'ok' : 'degraded',
      db: dbOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      uptime_s: Math.round(process.uptime()),
    };

    if (!ok) {
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return body;
  }
}
