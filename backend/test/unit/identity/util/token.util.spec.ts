import { generateSessionToken } from '../../../../src/modules/identity/util/token.util';

describe('generateSessionToken', () => {
  it('has the sess_ prefix', () => {
    expect(generateSessionToken().startsWith('sess_')).toBe(true);
  });

  it('produces a base64url body of 43 chars (32 bytes)', () => {
    const token = generateSessionToken();
    const body = token.slice('sess_'.length);
    expect(body.length).toBe(43);
    expect(/^[A-Za-z0-9_-]+$/.test(body)).toBe(true);
  });

  it('produces unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 1000; i++) tokens.add(generateSessionToken());
    expect(tokens.size).toBe(1000);
  });
});
