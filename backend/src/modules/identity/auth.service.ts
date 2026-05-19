import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Db } from '../../db/db.module';
import { users, type User } from '../../db/schema';
import type { LoginDto } from './dto/login.schema';
import type { SignupDto } from './dto/signup.schema';
import { SessionService, type SessionMeta } from './session.service';
import { normalizeEmail } from './util/email.util';
import { hashPassword, verifyPassword } from './util/password.util';

export type PublicUser = Omit<User, 'passwordHash'>;

let DUMMY_HASH_PROMISE: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!DUMMY_HASH_PROMISE) {
    DUMMY_HASH_PROMISE = hashPassword('not-a-real-password-but-fixed');
  }
  return DUMMY_HASH_PROMISE;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly sessions: SessionService,
  ) {
    void getDummyHash();
  }

  async signup(dto: SignupDto): Promise<{ user: PublicUser }> {
    const email = normalizeEmail(dto.email);
    const passwordHash = await hashPassword(dto.password);
    try {
      const [user] = await this.db
        .insert(users)
        .values({ email, passwordHash, name: dto.name })
        .returning();
      return { user: toPublic(user) };
    } catch (err) {
      if (isUniqueViolation(err, 'users_email_unique')) {
        throw new ConflictException('Email already registered');
      }
      this.logger.error('signup failed', err);
      throw err;
    }
  }

  async login(dto: LoginDto, meta: SessionMeta): Promise<{ user: PublicUser; token: string }> {
    const email = normalizeEmail(dto.email);
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    const candidateHash = user?.passwordHash ?? (await getDummyHash());
    const ok = await verifyPassword(candidateHash, dto.password);

    if (!user || !ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.sessions.create(user.id, meta);
    return { user: toPublic(user), token };
  }

  async logout(token: string): Promise<void> {
    await this.sessions.revoke(token);
  }
}

export function toPublic(u: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = u;
  return rest;
}

function isUniqueViolation(err: unknown, constraint?: string): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth++) {
    if (typeof current === 'object') {
      const e = current as { code?: string; constraint_name?: string; cause?: unknown };
      if (e.code === '23505' && (!constraint || e.constraint_name === constraint)) {
        return true;
      }
      current = e.cause;
    } else {
      break;
    }
  }
  return false;
}
