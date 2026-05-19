import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import * as schema from './schema';

export const DB = Symbol('DB');
export const PG = Symbol('PG');

export type Db = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: PG,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Sql => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        return postgres(url, { max: 10 });
      },
    },
    {
      provide: DB,
      inject: [PG],
      useFactory: (sql: Sql): Db => drizzle(sql, { schema }),
    },
  ],
  exports: [DB, PG],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(PG) private readonly sql: Sql) {}

  async onApplicationShutdown() {
    await this.sql.end();
  }
}
