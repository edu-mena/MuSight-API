console.log('[BOOT] logger.js início', Date.now());
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import winston from 'winston';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '..', 'logs');

let fileLoggingEnabled = true;
try {
    fs.mkdirSync(logsDir, { recursive: true });
} catch (err) {
    fileLoggingEnabled = false;
    console.error('[BOOT] Não foi possível criar pasta de logs, usando apenas console:', err.message);
}

const isProduction = process.env.NODE_ENV === 'production';

const transports = [];

if (fileLoggingEnabled) {
    transports.push(
        new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(logsDir, 'combined.log') })
    );
}

// Sempre inclui console em produção também, já que a Hostinger lê stdout
transports.push(
    new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
);

const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports,
});

console.log('[BOOT] logger.js fim', Date.now());
export default logger;