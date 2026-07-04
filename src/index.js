import http from 'node:http';

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.end('ok');
}).listen(PORT, '0.0.0.0', () => {
    console.log('listening', PORT);
});
