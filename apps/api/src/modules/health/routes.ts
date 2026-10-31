import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { errorResponseSchema } from '@caqui-chatbot/shared';
import { healthResponseSchema } from './schemas.js';
import { checkDatabase } from './service.js';

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      logLevel: 'warn',
      schema: {
        operationId: 'getHealth',
        tags: ['health'],
        summary: 'Liveness and database check',
        description: 'Returns ok when the API is up and the SQLite database answers.',
        response: { 200: healthResponseSchema, 500: errorResponseSchema },
      },
    },
    () => {
      checkDatabase();
      return { status: 'ok' as const };
    },
  );
};
