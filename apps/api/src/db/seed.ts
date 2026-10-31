import { eq } from 'drizzle-orm';
import { auth } from '../auth.js';
import { env } from '../env.js';
import { db, sqlite } from './client.js';
import { user } from './schema.js';

const existing = db.select({ id: user.id }).from(user).where(eq(user.email, env.SEED_USER_EMAIL)).get();

if (existing) {
  console.info(`seed user ${env.SEED_USER_EMAIL} already exists`);
} else {
  await auth.api.signUpEmail({
    body: { email: env.SEED_USER_EMAIL, password: env.SEED_USER_PASSWORD, name: env.SEED_USER_NAME },
  });
  console.info(`seed user ${env.SEED_USER_EMAIL} created`);
}
sqlite.close();
