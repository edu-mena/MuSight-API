process.on('uncaughtException', (err) => {
    console.error('[FATAL] uncaughtException:', err.stack || err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] unhandledRejection:', reason?.stack || reason);
});

import app from './app.js';

const PORT = process.env.PORT || 3000;

console.log('[BOOT] prestes a chamar listen()', Date.now());

app.listen(PORT, '0.0.0.0', () => {
    console.log('[BOOT] LISTENING na porta', PORT, Date.now());
}).on('error', (err) => {
    console.error('[BOOT] LISTEN ERROR:', err.stack || err.message);
});