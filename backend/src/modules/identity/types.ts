import { Request } from 'express';
import type { User } from '../../db/schema';

export interface SessionContext {
  token: string;
  userId: string;
}

export type AuthedRequest = Request & {
  user: User;
  session: SessionContext;
};
