import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive(),
  WEB_URL: z.string().url(),
  DATABASE_PATH: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  SEED_USER_EMAIL: z.string().email(),
  SEED_USER_PASSWORD: z.string().min(8),
  SEED_USER_NAME: z.string().min(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  throw new Error(
    `Invalid environment variables:\n${lines.join('\n')}\nCopy .env.example to .env (yarn setup does it).`,
  );
}

export const env = {
  ...parsed.data,
  /** Absolute path of the SQLite file (relative values are resolved against the repo root). */
  DATABASE_FILE: path.resolve(repoRoot, parsed.data.DATABASE_PATH),
};
