import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { FastifyRequest } from 'fastify';
import { errorResponseSchema } from '@caqui-chatbot/shared';
import { env } from '../../env.js';
import { AppError } from '../../lib/errors.js';
import { OpenRouterProvider } from './openrouter.js';
import { DemoChatService } from './service.js';
import {
  chatRequestSchema,
  chatResponseSchema,
  sessionRequestSchema,
  sessionResponseSchema,
  statusSchema,
  type DemoIdentity,
} from './schemas.js';

export const provider = new OpenRouterProvider({
  apiKey: env.OPENROUTER_API_KEY,
  enabled: env.CAQUI_LIVE_AI_ENABLED === 'true' && env.NODE_ENV === 'development',
  budgetUsd: env.CAQUI_TEST_BUDGET_USD,
  ...(env.NODE_ENV === 'test'
    ? {}
    : { ledgerPath: fileURLToPath(new URL('../../../../../.logs/openrouter-usage.jsonl', import.meta.url)) }),
});
export const demoChatService = new DemoChatService(provider);
type Session = DemoIdentity & { expiresAt: number; busy: boolean; requests: number[] };
const sessions = new Map<string, Session>();
function localOnly(request: FastifyRequest): Promise<void> {
  if (env.NODE_ENV === 'production' || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.ip))
    throw new AppError(403, 'LOCAL_DEMO_ONLY', 'Esta integração é restrita ao computador local.');
  if (request.headers.origin && request.headers.origin !== env.WEB_URL)
    throw new AppError(403, 'ORIGIN_DENIED', 'Origem não autorizada.');
  return Promise.resolve();
}
const errors = {
  400: errorResponseSchema,
  401: errorResponseSchema,
  403: errorResponseSchema,
  429: errorResponseSchema,
  500: errorResponseSchema,
};
export const demoChatRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/demo/status',
    {
      preHandler: localOnly,
      schema: {
        operationId: 'demoChatStatus',
        tags: ['local-demo'],
        summary: 'Local model availability and test budget',
        response: { 200: statusSchema, ...errors },
      },
    },
    () => provider.status(),
  );
  app.post(
    '/demo/session',
    {
      preHandler: localOnly,
      schema: {
        operationId: 'createLocalDemoSession',
        tags: ['local-demo'],
        summary: 'Create a bounded local demo session, not production authentication',
        body: sessionRequestSchema,
        response: { 200: sessionResponseSchema, ...errors },
      },
    },
    (request) => {
      for (const [key, value] of sessions) if (value.expiresAt < Date.now()) sessions.delete(key);
      if (sessions.size >= 100)
        throw new AppError(429, 'SESSION_LIMIT', 'Reinicie o servidor para uma nova rodada da demonstração.');
      const token = randomBytes(32).toString('hex'),
        expiresAt = Date.now() + 30 * 60 * 1000;
      sessions.set(token, { ...request.body, expiresAt, busy: false, requests: [] });
      return { ...request.body, token, expiresAt };
    },
  );
  for (const role of ['client', 'agent'] as const) {
    app.post(
      role === 'client' ? '/demo/chat' : '/demo/copilot',
      {
        preHandler: localOnly,
        schema: {
          operationId: role === 'client' ? 'localDemoChat' : 'localDemoCopilot',
          tags: ['local-demo'],
          summary: role === 'client' ? 'Explain authorized client facts' : 'Draft a reply for agent review',
          body: chatRequestSchema,
          response: { 200: chatResponseSchema, ...errors },
        },
      },
      async (request) => {
        const token = request.headers['x-demo-session'];
        const session = typeof token === 'string' ? sessions.get(token) : undefined;
        if (!session || session.expiresAt < Date.now())
          throw new AppError(401, 'DEMO_SESSION_REQUIRED', 'Abra uma sessão local de demonstração.');
        if (session.role !== role)
          throw new AppError(403, 'ROLE_DENIED', 'Esta sessão não pode acessar o copiloto interno.');
        session.requests = session.requests.filter((at) => at > Date.now() - 60000);
        if (session.busy || session.requests.length >= 10)
          throw new AppError(429, 'DEMO_RATE_LIMIT', 'Aguarde a resposta atual ou tente mais tarde.');
        session.requests.push(Date.now());
        session.busy = true;
        try {
          return await demoChatService.answer(session, request.body);
        } finally {
          session.busy = false;
        }
      },
    );
  }
};
