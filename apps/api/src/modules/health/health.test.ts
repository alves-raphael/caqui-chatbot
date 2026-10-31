import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

describe('GET /health', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });
  afterAll(() => app.close());

  it('returns ok when the database answers', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
