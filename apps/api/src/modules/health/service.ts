import { sqlite } from '../../db/client.js';

export function checkDatabase(): void {
  sqlite.prepare('select 1').get();
}
