import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { errorResponseSchema } from '@caqui-chatbot/shared';
import { unauthorized } from '../../lib/errors.js';
import { requireAuth } from '../../lib/require-auth.js';
import { meResponseSchema } from './schemas.js';
import { toMe } from './service.js';

export const meRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/me',
    {
      preHandler: requireAuth,
      schema: {
        operationId: 'getMe',
        tags: ['me'],
        summary: 'Current user',
        description: 'Returns the user of the current session cookie.',
        response: { 200: meResponseSchema, 401: errorResponseSchema },
      },
    },
    (request) => {
      if (!request.session) throw unauthorized();
      return toMe(request.session.user);
    },
  );
};
