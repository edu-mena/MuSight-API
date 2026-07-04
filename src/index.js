import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const traceFile = path.join(os.tmpdir(), 'boot-trace.log');
const trace = (msg) => fs.writeFileSync(traceFile, `${msg} ${Date.now()}\n`, { flag: 'a' });

trace('index.js início');
console.log('[BOOT] index.js início', Date.now());
import 'dotenv/config.js';
trace('dotenv carregado');
console.log('[BOOT] dotenv carregado', Date.now());
import app from './app.js';

trace('app importada');
console.log('[BOOT] index.js: app importada', Date.now());
const PORT = process.env.PORT || 3000;

trace('prestes a chamar listen()');
console.log('[BOOT] index.js: prestes a chamar listen()', Date.now());
app.listen(PORT, '0.0.0.0', () => {
    trace('LISTEN CALLBACK');
    console.log('[BOOT] index.js: listen() callback', Date.now());
    console.log(`Servidor ouvindo em http://localhost:${PORT}`);
});
