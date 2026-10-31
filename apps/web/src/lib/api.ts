import { errorResponseSchema } from '@caqui-chatbot/shared';
import type { z } from 'zod';

export const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Typed GET: the response is validated with the same Zod schema the API serializes with. */
export async function apiGet<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = errorResponseSchema.safeParse(body);
    throw parsed.success
      ? new ApiError(res.status, parsed.data.error.code, parsed.data.error.message)
      : new ApiError(res.status, 'UNKNOWN', res.statusText);
  }
  return schema.parse(body);
}
