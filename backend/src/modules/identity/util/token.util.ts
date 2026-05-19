import { randomBytes } from 'crypto';

const PREFIX = 'sess_';
const RAW_BYTES = 32;

export function generateSessionToken(): string {
  return PREFIX + randomBytes(RAW_BYTES).toString('base64url');
}
