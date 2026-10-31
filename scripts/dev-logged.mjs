import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { root } from './lib.mjs';

fs.mkdirSync(path.join(root, '.logs'), { recursive: true });
const log = fs.createWriteStream(path.join(root, '.logs/dev.log'), { flags: 'w' });
const child = spawn('yarn', ['dev'], { cwd: root, stdio: ['inherit', 'pipe', 'pipe'] });
for (const stream of [child.stdout, child.stderr]) {
  stream.on('data', (chunk) => {
    process.stdout.write(chunk);
    log.write(chunk);
  });
}
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
