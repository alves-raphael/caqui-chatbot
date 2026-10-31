import type { FastifyRequest } from 'fastify';
import { auth } from '../auth.js';
import { unauthorized } from './errors.js';

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

declare module 'fastify' {
  interface FastifyRequest {
    session: Session | null;
  }
}

export function toHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }
  return headers;
}

/** preHandler: resolves the Better Auth session or answers 401. */
export async function requireAuth(request: FastifyRequest): Promise<void> {
  const session = await auth.api.getSession({ headers: toHeaders(request) });
  if (!session) throw unauthorized();
  request.session = session;
}
