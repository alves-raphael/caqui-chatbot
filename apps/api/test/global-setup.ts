import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.resolve(here, '../../../data/test.db');

/** Fresh migrated SQLite file for the test run (separate from the dev database). */
export default function setup(): void {
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(`${dbFile}${suffix}`, { force: true });
  const sqlite = new Database(dbFile);
  migrate(drizzle(sqlite), { migrationsFolder: path.resolve(here, '../drizzle') });
  sqlite.close();
}
