import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.resolve(here, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  return {
    envDir,
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(here, 'src') } },
    server: { host: true, port: Number(env['WEB_PORT']), strictPort: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      exclude: ['e2e/**', 'node_modules/**'],
    },
  };
});
