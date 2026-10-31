import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client.js';

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle');

migrate(db, { migrationsFolder });
sqlite.close();
console.info('migrations applied');
