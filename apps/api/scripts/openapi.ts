import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/app.js';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../openapi.json');

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
}

const app = await buildApp();
await app.ready();
const generated = `${JSON.stringify(sortKeys(app.swagger()), null, 2)}\n`;
await app.close();

if (process.argv.includes('--check')) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current !== generated) {
    console.error('apps/api/openapi.json is stale. Run `yarn api:openapi`.');
    process.exit(1);
  }
  console.info('openapi.json is up to date');
} else {
  fs.writeFileSync(file, generated);
  console.info('openapi.json written');
}
process.exit(0);
