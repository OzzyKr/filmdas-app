import { signupSchema } from '../../../../src/modules/identity/dto/signup.schema';

describe('signupSchema', () => {
  const base = { email: 'a@b.com', password: 'Passw0rd', name: 'Aylin' };

  it('accepts a valid input', () => {
    const result = signupSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('normalizes email (trim + lowercase)', () => {
    const result = signupSchema.safeParse({ ...base, email: '  Alice@Example.COM  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('alice@example.com');
    }
  });

  it('trims the name', () => {
    const result = signupSchema.safeParse({ ...base, name: '  Aylin  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Aylin');
  });

  it.each([
    ['too short', 'Pa1', 'at least 8'],
    ['missing uppercase', 'passw0rd', 'uppercase'],
    ['missing lowercase', 'PASSW0RD', 'lowercase'],
    ['missing digit', 'Password', 'digit'],
  ])('rejects password: %s', (_label, password, fragment) => {
    const result = signupSchema.safeParse({ ...base, password });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' | ');
      expect(messages.toLowerCase()).toContain(fragment);
    }
  });

  it('rejects malformed email', () => {
    const result = signupSchema.safeParse({ ...base, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = signupSchema.safeParse({ ...base, name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(signupSchema.safeParse({}).success).toBe(false);
    expect(signupSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });
});
