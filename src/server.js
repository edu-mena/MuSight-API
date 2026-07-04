console.log('[BOOT] server.js início', Date.now());
import app from './app.js';

console.log('[BOOT] server.js: app importada', Date.now());
const PORT = process.env.PORT || 3000;

console.log('[BOOT] server.js: prestes a chamar listen()', Date.now());
app.listen(PORT, '0.0.0.0', () => {
    console.log('[BOOT] server.js: listen() callback', Date.now());
    console.log(`Servidor ouvindo em http://localhost:${PORT}`);
});
