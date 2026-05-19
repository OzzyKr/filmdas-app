import { sql } from 'drizzle-orm';
import Redis from 'ioredis';
import type { Db } from '../../src/db/db.module';

export async function truncateAll(db: Db, redis: Redis): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
  await redis.flushdb();
}
