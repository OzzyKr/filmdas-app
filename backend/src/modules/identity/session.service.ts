import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../../redis/redis.module';
import { generateSessionToken } from './util/token.util';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

interface StoredSession {
  userId: string;
  createdAt: number;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async create(userId: string, meta: SessionMeta = {}): Promise<string> {
    const token = generateSessionToken();
    const payload: StoredSession = {
      userId,
      createdAt: Date.now(),
      ip: meta.ip,
      userAgent: meta.userAgent,
    };

    await this.redis
      .multi()
      .set(sessKey(token), JSON.stringify(payload), 'EX', SESSION_TTL_SECONDS)
      .sadd(userSessionsKey(userId), token)
      .expire(userSessionsKey(userId), SESSION_TTL_SECONDS)
      .exec();

    return token;
  }

  async touch(token: string): Promise<{ userId: string } | null> {
    const raw = await this.redis.get(sessKey(token));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    await this.redis
      .multi()
      .expire(sessKey(token), SESSION_TTL_SECONDS)
      .expire(userSessionsKey(parsed.userId), SESSION_TTL_SECONDS)
      .exec();
    return { userId: parsed.userId };
  }

  async revoke(token: string): Promise<void> {
    const raw = await this.redis.get(sessKey(token));
    if (!raw) return;
    const { userId } = JSON.parse(raw) as StoredSession;
    await this.redis.multi().del(sessKey(token)).srem(userSessionsKey(userId), token).exec();
  }
}

export function sessKey(token: string): string {
  return `sess:${token}`;
}

export function userSessionsKey(userId: string): string {
  return `user:${userId}:sessions`;
}
