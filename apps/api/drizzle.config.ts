import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'drizzle-kit';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: path.resolve(repoRoot, process.env['DATABASE_PATH'] ?? './data/caqui-chatbot.db') },
});
