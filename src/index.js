import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const traceFile = path.join(os.tmpdir(), 'boot-trace.log');
const trace = (msg) => fs.writeFileSync(traceFile, `${msg} ${Date.now()}\n`, { flag: 'a' });

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.end('ok');
});

server.on('error', (err) => {
    trace(`LISTEN ERROR: ${err.stack || err.message}`);
});

trace('prestes a chamar listen()');
try {
    server.listen(PORT, '0.0.0.0', () => {
        trace('LISTEN CALLBACK OK');
        console.log('listening', PORT);
    });
    trace('listen() chamado sem exceção síncrona');
} catch (err) {
    trace(`LISTEN THROW SÍNCRONO: ${err.stack || err.message}`);
}

export default server;
