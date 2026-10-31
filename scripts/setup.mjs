import fs from 'node:fs';
import path from 'node:path';
import { capture, composeServices, loadEnv, ping, printUrls, root, run } from './lib.mjs';

const envFile = path.join(root, '.env');
if (!fs.existsSync(envFile)) {
  fs.copyFileSync(path.join(root, '.env.example'), envFile);
  console.info('created .env from .env.example');
}
const env = loadEnv();

run('yarn', ['install']);

const apiUrl = `http://localhost:${env.API_PORT ?? '3000'}`;
const webUrl = `http://localhost:${env.WEB_PORT ?? '5174'}`;

if ((await ping(`${apiUrl}/health`)) && (await ping(webUrl))) {
  console.info('environment already running, nothing to start');
} else {
  run('docker', ['compose', 'build', 'migrate']);
  run('docker', ['compose', 'up', '-d']);

  const deadline = Date.now() + 180_000;
  for (;;) {
    const services = composeServices();
    const migrate = services.find((s) => s.Service === 'migrate');
    if (migrate?.State === 'exited' && migrate.ExitCode !== 0) {
      console.error(capture('docker', ['compose', 'logs', 'migrate']));
      throw new Error('migrate service failed');
    }
    const apiHealthy = services.find((s) => s.Service === 'api')?.Health === 'healthy';
    const webHealthy = services.find((s) => s.Service === 'web')?.Health === 'healthy';
    if (apiHealthy && webHealthy) break;
    if (Date.now() > deadline) {
      console.error(capture('docker', ['compose', 'logs', '--tail', '50']));
      throw new Error('timed out waiting for api/web to become healthy');
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

run('yarn', ['workspace', '@caqui-chatbot/web', 'exec', 'playwright', 'install', 'chromium']);
printUrls(env);
