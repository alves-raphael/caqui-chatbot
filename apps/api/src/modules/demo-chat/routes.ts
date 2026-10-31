import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { FastifyRequest } from 'fastify';
import { errorResponseSchema } from '@caqui-chatbot/shared';
import { env } from '../../env.js';
import { AppError } from '../../lib/errors.js';
import { OpenRouterProvider } from './openrouter.js';
import { supportAvailability } from './availability.js';
import { DemoChatService } from './service.js';
import {
  chatRequestSchema,
  chatResponseSchema,
  sessionRequestSchema,
  sessionResponseSchema,
  statusSchema,
  flowRequestSchema,
  flowResponseSchema,
  type DemoIdentity,
} from './schemas.js';

export const provider = new OpenRouterProvider({
  apiKey: env.OPENROUTER_API_KEY,
  enabled:
    env.CAQUI_LIVE_AI_ENABLED === 'true' &&
    (env.NODE_ENV === 'development' || env.CAQUI_PUBLIC_DEMO === 'true'),
  budgetUsd: env.CAQUI_TEST_BUDGET_USD,
  previousReservedUsd: env.CAQUI_PREVIOUS_RESERVED_USD,
  localOnly: env.CAQUI_PUBLIC_DEMO !== 'true',
  ...(env.NODE_ENV === 'test'
    ? {}
    : {
        ledgerPath:
          env.CAQUI_LEDGER_PATH ??
          fileURLToPath(new URL('../../../../../.logs/openrouter-usage.jsonl', import.meta.url)),
      }),
});
export const demoChatService = new DemoChatService(provider);
type Session = DemoIdentity & {
  expiresAt: number;
  busy: boolean;
  requests: number[];
  state: 'bot' | 'helpOptional' | 'queued' | 'human' | 'closed';
  revision: number;
  steps: number;
  security: boolean;
};
const sessions = new Map<string, Session>();
function localOnly(request: FastifyRequest): Promise<void> {
  // Public demo is protected by the global access-code and same-origin guards.
  if (env.CAQUI_PUBLIC_DEMO === 'true') return Promise.resolve();
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
  409: errorResponseSchema,
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
      for (const [key, value] of sessions)
        if (value.expiresAt < Date.now()) {
          sessions.delete(key);
          demoChatService.clearConversation(key);
        }
      if (sessions.size >= 100)
        throw new AppError(429, 'SESSION_LIMIT', 'Reinicie o servidor para uma nova rodada da demonstração.');
      const token = randomBytes(32).toString('hex'),
        expiresAt = Date.now() + 30 * 60 * 1000;
      sessions.set(token, {
        ...request.body,
        expiresAt,
        busy: false,
        requests: [],
        state: 'bot',
        revision: 0,
        steps: 0,
        security: false,
      });
      return { ...request.body, token, expiresAt };
    },
  );
  app.post(
    '/demo/flow',
    {
      preHandler: localOnly,
      schema: {
        operationId: 'transitionDemoConversation',
        tags: ['local-demo'],
        summary: 'Queue a demonstration conversation or let the matching demo agent assume it',
        body: flowRequestSchema,
        response: { 200: flowResponseSchema, ...errors },
      },
    },
    (request) => {
      const token = request.headers['x-demo-session'];
      const actor = typeof token === 'string' ? sessions.get(token) : undefined;
      if (!actor || actor.expiresAt < Date.now())
        throw new AppError(401, 'DEMO_SESSION_REQUIRED', 'Abra uma sessão de demonstração.');
      const target = request.body.clientSession ? sessions.get(request.body.clientSession) : actor;
      if (
        !target ||
        target.role !== 'client' ||
        target.expiresAt < Date.now() ||
        target.clientId !== actor.clientId
      )
        throw new AppError(403, 'CASE_DENIED', 'Atendimento não disponível nesta sessão.');
      const availability = supportAvailability(target.security || request.body.event === 'security');
      if (request.body.event === 'assume') {
        if (actor.role !== 'agent' || target.state !== 'queued')
          throw new AppError(403, 'ASSUME_DENIED', 'Somente o atendente pode assumir um protocolo na fila.');
        if (!availability.available)
          throw new AppError(409, 'SUPPORT_CLOSED', availability.message, { availability });
        target.state = 'human';
      } else if (request.body.event === 'queue' || request.body.event === 'security') {
        if (request.body.event === 'security') target.security = true;
        if (target.state !== 'closed') target.state = 'queued';
      } else target.state = 'closed';
      target.revision++;
      return { state: target.state, availability };
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
        if (role === 'client' && !['bot', 'helpOptional'].includes(session.state))
          throw new AppError(
            409,
            'AI_PAUSED',
            'A IA está pausada neste atendimento. Aguarde a pessoa assumir; depois as mensagens seguem para ela.',
          );
        session.requests = session.requests.filter((at) => at > Date.now() - 60000);
        if (session.busy || session.requests.length >= 10)
          throw new AppError(429, 'DEMO_RATE_LIMIT', 'Aguarde a resposta atual ou tente mais tarde.');
        session.requests.push(Date.now());
        session.busy = true;
        try {
          const revision = session.revision;
          let response = await demoChatService.answer(
            session,
            request.body,
            typeof token === 'string' ? token : undefined,
          );
          if (
            role === 'client' &&
            (revision !== session.revision || !['bot', 'helpOptional'].includes(session.state))
          )
            throw new AppError(409, 'AI_PAUSED', 'Resposta descartada porque o atendimento mudou de estado.');
          if (role === 'client') {
            session.steps = response.resolution === 'answered' ? 0 : session.steps + 1;
            if (session.steps >= 5 && !response.handoff)
              response = {
                ...response,
                text: 'Ainda não conseguimos concluir esta dúvida. Vou encaminhar o histórico para uma pessoa continuar.',
                sources: ['KB-025', 'KB-026'],
                mode: 'rule',
                model: null,
                handoff: 'support',
                handoffReason: 'no_progress_limit',
                resolution: 'handoff',
                quickReplies: [],
                notice: 'Limite de etapas sem resolução; atendimento encaminhado.',
              };
          }
          if (role === 'client' && response.handoff) {
            if (response.handoff === 'security') session.security = true;
            session.state = 'queued';
            session.revision++;
          }
          return response;
        } finally {
          session.busy = false;
        }
      },
    );
  }
};
