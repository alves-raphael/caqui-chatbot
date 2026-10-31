import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { env } from './env.js';

const webRoot = fileURLToPath(new URL('../../web/dist/', import.meta.url));
const mime: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

export async function configurePublicDemo(app: FastifyInstance) {
  if (!env.CAQUI_LEDGER_PATH) throw new Error('Public demo requires a persistent usage ledger path.');
  app.addHook('onRequest', async (request, reply) => {
    void reply.header('Cache-Control', 'no-store');
    void reply.header('X-Content-Type-Options', 'nosniff');
    void reply.header('Referrer-Policy', 'no-referrer');
    void reply.header('X-Frame-Options', 'SAMEORIGIN');
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
