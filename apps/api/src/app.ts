import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { auth } from './auth.js';
import { env } from './env.js';
import { AppError } from './lib/errors.js';
import { toHeaders } from './lib/require-auth.js';
import { healthRoutes } from './modules/health/routes.js';
import { meRoutes } from './modules/me/routes.js';
import { demoChatRoutes } from './modules/demo-chat/routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: 'info' },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorateRequest('session', null);

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.validation },
      });
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }
    request.log.error({ err: error }, 'unhandled error');
    return reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });

  await app.register(cors, { origin: env.WEB_URL, credentials: true });
  await app.register(swagger, {
    openapi: { info: { title: 'caqui-chatbot API', version: '0.0.0' } },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Better Auth catch-all, hidden from the OpenAPI document.
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    schema: { hide: true },
    handler: async (request, reply) => {
      const url = new URL(request.url, env.BETTER_AUTH_URL);
      const hasBody = request.method !== 'GET' && request.body !== undefined;
      const response = await auth.handler(
        new Request(url, {
          method: request.method,
          headers: toHeaders(request),
          ...(hasBody ? { body: JSON.stringify(request.body) } : {}),
        }),
      );
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') return;
        void reply.header(key, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) void reply.header('set-cookie', cookies);
      return reply.send(response.body ? await response.text() : null);
    },
  });

  await app.register(healthRoutes);
  await app.register(meRoutes);
  await app.register(demoChatRoutes);

  return app;
}
