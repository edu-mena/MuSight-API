console.log('[BOOT] início', Date.now());

const http = require('node:http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => res.end('ok'));

server.listen(PORT, '0.0.0.0', () => {
    console.log('[BOOT] LISTENING na porta', PORT, Date.now());
});