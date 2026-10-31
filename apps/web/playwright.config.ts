import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.resolve(here, '../../.env'));
} catch {
  // CI provides the variables directly.
}

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  reporter: [['list']],
  use: { baseURL: process.env['WEB_URL'] ?? 'http://localhost:5174' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
      use: { browserName: 'chromium', storageState: 'e2e/.auth/user.json' },
    },
  ],
});
