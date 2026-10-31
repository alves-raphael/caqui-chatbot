import { composeServices, loadEnv, ping, printUrls, run } from './lib.mjs';

const env = loadEnv();
const apiUrl = `http://localhost:${env.API_PORT ?? '3000'}`;
const webUrl = `http://localhost:${env.WEB_PORT ?? '5174'}`;

try {
  run('docker', ['compose', 'ps', '-a']);
} catch {
  /* docker not available: the pings below still tell the truth */
}
const services = composeServices();
const unhealthy = services.filter(
  (s) => s.Service !== 'migrate' && (s.State !== 'running' || (s.Health && s.Health !== 'healthy')),
);
const migrate = services.find((s) => s.Service === 'migrate');
const migrateOk = !migrate || (migrate.State === 'exited' && migrate.ExitCode === 0);
const apiOk = await ping(`${apiUrl}/health`);
const webOk = await ping(webUrl);

console.info(`api  /health: ${apiOk ? 'ok' : 'DOWN'}`);
console.info(`web  /:       ${webOk ? 'ok' : 'DOWN'}`);
printUrls(env);

const healthy = apiOk && webOk && migrateOk && unhealthy.length === 0;
console.info(healthy ? 'status: healthy' : 'status: NOT healthy (run `yarn setup`)');
process.exit(healthy ? 0 : 1);
