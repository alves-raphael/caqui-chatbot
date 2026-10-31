import type { z } from 'zod';
import type { meResponseSchema } from './schemas.js';

export function toMe(user: { id: string; name: string; email: string }): z.infer<typeof meResponseSchema> {
  return { id: user.id, name: user.name, email: user.email };
}
