import { normalizeEmail } from '../../../../src/modules/identity/util/email.util';

describe('normalizeEmail', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  a@b.com  ')).toBe('a@b.com');
  });

  it('lowercases the entire address', () => {
    expect(normalizeEmail('Alice@EXAMPLE.com')).toBe('alice@example.com');
  });

  it('combines trim + lowercase', () => {
    expect(normalizeEmail('  Foo@Bar.IO  ')).toBe('foo@bar.io');
  });

  it('is idempotent', () => {
    const once = normalizeEmail('Alice@Example.com');
    expect(normalizeEmail(once)).toBe(once);
  });
});
