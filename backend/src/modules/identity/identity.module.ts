import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { REDIS } from '../../redis/redis.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { normalizeEmail } from './util/email.util';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 5;

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [REDIS],
      useFactory: (redis: Redis) => ({
        storage: new ThrottlerStorageRedisService(redis),
        throttlers: [
          {
            name: 'login-ip',
            ttl: LOGIN_WINDOW_MS,
            limit: LOGIN_LIMIT,
            getTracker: (req: { ip?: string }) => `ip:${req.ip ?? 'unknown'}`,
          },
          {
            name: 'login-email',
            ttl: LOGIN_WINDOW_MS,
            limit: LOGIN_LIMIT,
            getTracker: (req: { body?: { email?: unknown } }) => {
              const raw = typeof req.body?.email === 'string' ? req.body.email : '';
              const email = normalizeEmail(raw);
              return `email:${email || 'unknown'}`;
            },
          },
        ],
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionService, AuthGuard],
  exports: [AuthGuard, SessionService],
})
export class IdentityModule {}
