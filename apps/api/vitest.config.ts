import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

try {
  process.loadEnvFile(path.join(root, '.env'));
} catch {
  // CI and containers provide the variables directly.
}

export default defineConfig({
  test: {
    globalSetup: ['./test/global-setup.ts'],
    env: { NODE_ENV: 'test', DATABASE_PATH: './data/test.db' },
    fileParallelism: false,
  },
});
