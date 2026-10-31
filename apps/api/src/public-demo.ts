import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { env } from './env.js';

const webRoot = fileURLToPath(new URL('../../web/dist/', import.meta.url));
const hash = (value: string) => createHash('sha256').update(value).digest();
const mime: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

export async function configurePublicDemo(app: FastifyInstance) {
  if (!env.CAQUI_DEMO_ACCESS_CODE || !env.CAQUI_LEDGER_PATH)
    throw new Error('Public demo requires an access code and a persistent usage ledger path.');
  const expected = hash(`demo:${env.CAQUI_DEMO_ACCESS_CODE}`);
  let attempts = 0;
  let resetAt = Date.now() + 60000;
  app.addHook('onRequest', async (request, reply) => {
    void reply.header('Cache-Control', 'no-store');
    void reply.header('X-Content-Type-Options', 'nosniff');
    void reply.header('Referrer-Policy', 'no-referrer');
    void reply.header('X-Frame-Options', 'SAMEORIGIN');
    if (request.url.split('?')[0] === '/health') return;
    if (Date.now() > resetAt) {
      attempts = 0;
      resetAt = Date.now() + 60000;
    }
    const auth = request.headers.authorization;
    const provided = auth?.startsWith('Basic ') ? Buffer.from(auth.slice(6), 'base64').toString() : '';
    if (!timingSafeEqual(hash(provided), expected)) {
      attempts++;
      return reply
        .header('WWW-Authenticate', 'Basic realm="PatricIA demo", charset="UTF-8"')
        .code(attempts > 120 ? 429 : 401)
        .send('Acesso de demonstracao necessario.');
    }
    if (request.method === 'POST' && request.headers.origin !== new URL(env.WEB_URL).origin)
      return reply.code(403).send('Origem nao autorizada.');
  });
  app.get('/', { schema: { hide: true } }, (_request, reply) => reply.redirect('/demo'));
  app.get('/demo', { schema: { hide: true } }, async (_request, reply) =>
    reply.type('text/html').send(await readFile(path.join(webRoot, 'index.html'))),
  );
  app.get<{ Params: { name: string } }>(
    '/assets/:name',
    { schema: { hide: true } },
    async (request, reply) => {
      const name = request.params.name;
      const type = mime[path.extname(name)];
      if (!/^[a-zA-Z0-9_.-]+$/.test(name) || !type) return reply.code(404).send();
      try {
        return reply.type(type).send(await readFile(path.join(webRoot, 'assets', name)));
      } catch {
        return reply.code(404).send();
      }
    },
  );
}
