import { hashPassword, verifyPassword } from '../../../../src/modules/identity/util/password.util';

describe('password hashing', () => {
  it('produces a hash different from the plaintext', async () => {
    const hash = await hashPassword('Passw0rd!');
    expect(hash).not.toBe('Passw0rd!');
    expect(hash.length).toBeGreaterThan(40);
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('Passw0rd!');
    await expect(verifyPassword(hash, 'Passw0rd!')).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('Passw0rd!');
    await expect(verifyPassword(hash, 'wrong')).resolves.toBe(false);
  });

  it('produces distinct hashes for the same plaintext (salt)', async () => {
    const a = await hashPassword('Passw0rd!');
    const b = await hashPassword('Passw0rd!');
    expect(a).not.toBe(b);
  });
});
