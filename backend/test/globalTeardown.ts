import * as fs from 'fs';
import { STATE_FILE } from './globalSetup';

export default async function globalTeardown(): Promise<void> {
  const handles = globalThis.__TC__;
  if (handles) {
    await Promise.allSettled([handles.pg.stop(), handles.redis.stop()]);
    globalThis.__TC__ = undefined;
  }
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {
    // file may not exist if setup failed
  }
}
