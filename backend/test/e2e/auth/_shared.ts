import type { TestApp } from '../../helpers/app';

export interface CreatedUser {
  id: string;
  email: string;
  name: string;
}

export async function signupUser(
  testApp: TestApp,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
): Promise<{ user: CreatedUser; password: string }> {
  const email = overrides.email ?? `user-${Date.now()}-${Math.random()}@example.com`;
  const password = overrides.password ?? 'Passw0rd';
  const name = overrides.name ?? 'Test User';

  const res = await testApp.http().post('/auth/signup').send({ email, password, name });
  if (res.status !== 201) {
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { user: res.body.user as CreatedUser, password };
}

export async function loginAs(
  testApp: TestApp,
  email: string,
  password: string,
): Promise<{ token: string; user: CreatedUser }> {
  const res = await testApp.http().post('/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token as string, user: res.body.user as CreatedUser };
}

export async function signupAndLogin(
  testApp: TestApp,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
): Promise<{ token: string; user: CreatedUser; password: string }> {
  const { user, password } = await signupUser(testApp, overrides);
  const { token } = await loginAs(testApp, user.email, password);
  return { token, user, password };
}
