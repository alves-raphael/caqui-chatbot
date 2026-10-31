import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv() {
  const file = path.join(root, '.env');
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return env;
}

export function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', ...opts });
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (exit ${res.status})`);
}

export function capture(cmd, args) {
  try {
    return execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    return typeof err.stdout === 'string' ? err.stdout : '';
  }
}

export async function ping(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Services of the compose project as [{ Service, State, Health }]. */
export function composeServices() {
  const out = capture('docker', ['compose', 'ps', '-a', '--format', 'json']).trim();
  if (!out) return [];
  return out.split('\n').map((l) => JSON.parse(l));
}

export function printUrls(env) {
  const web = env.WEB_PORT ?? '5174';
  const api = env.API_PORT ?? '3000';
  console.info(`
| Service      | URL / location                  | Logs                       |
|--------------|---------------------------------|----------------------------|
| web          | http://localhost:${web}            | docker compose logs web    |
| api          | http://localhost:${api}            | docker compose logs api    |
| OpenAPI docs | http://localhost:${api}/docs       |                            |
| SQLite       | ${env.DATABASE_PATH ?? './data/caqui-chatbot.db'} |                  |
`);
}
