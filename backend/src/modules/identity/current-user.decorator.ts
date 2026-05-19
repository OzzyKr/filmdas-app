import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { User } from '../../db/schema';
import type { AuthedRequest } from './types';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  return req.user;
});
