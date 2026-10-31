import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

describe('GET /me', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });
  afterAll(() => app.close());

  it('returns 401 with the shared error shape when not authenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
  });

  it('returns the current user for a valid session cookie', async () => {
    const email = `me-${Date.now()}@example.com`;
    const signUp = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { email, password: 'password-123', name: 'Me Test' },
    });
    expect(signUp.statusCode).toBe(200);
    const cookie = signUp.cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ email, name: 'Me Test' });
  });
});
