import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const STATE_FILE = path.join(os.tmpdir(), 'filmdas-tc-state.json');

const raw = fs.readFileSync(STATE_FILE, 'utf8');
const state = JSON.parse(raw) as { databaseUrl: string; redisUrl: string };

process.env.DATABASE_URL = state.databaseUrl;
process.env.REDIS_URL = state.redisUrl;
process.env.NODE_ENV = 'test';
