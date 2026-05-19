import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

export const STATE_FILE = path.join(os.tmpdir(), 'filmdas-tc-state.json');

declare global {
  var __TC__: { pg: StartedPostgreSqlContainer; redis: StartedRedisContainer } | undefined;
}

export default async function globalSetup(): Promise<void> {
  const [pg, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:17-alpine').start(),
    new RedisContainer('redis:7-alpine').start(),
  ]);

  const databaseUrl = pg.getConnectionUri();
  const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await migrate(drizzle(sql), {
      migrationsFolder: path.join(__dirname, '..', 'src', 'db', 'migrations'),
    });
  } finally {
    await sql.end();
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify({ databaseUrl, redisUrl }));
  globalThis.__TC__ = { pg, redis };
}
