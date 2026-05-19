import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Request } from 'express';
import { DB, type Db } from '../../db/db.module';
import { users } from '../../db/schema';
import { SessionService } from './session.service';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    @Inject(DB) private readonly db: Db,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException();
    }
    const token = header.slice(BEARER_PREFIX.length).trim();
    if (!token) throw new UnauthorizedException();

    const session = await this.sessions.touch(token);
    if (!session) throw new UnauthorizedException();

    const [user] = await this.db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) throw new UnauthorizedException();

    (req as unknown as { user: typeof user; session: { token: string; userId: string } }).user =
      user;
    (req as unknown as { user: typeof user; session: { token: string; userId: string } }).session =
      { token, userId: user.id };

    return true;
  }
}
