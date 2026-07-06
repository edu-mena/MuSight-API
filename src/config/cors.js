console.log('[BOOT] cors.js início', Date.now());

const CORS_ORIGINS = process.env.CORS_ORIGINS;

if (!CORS_ORIGINS) {
    console.error('[BOOT] ERRO FATAL: CORS_ORIGINS não está definido nas variáveis de ambiente');
    process.exit(1); // falha explícita e visível, em vez de throw síncrono no import
}

export const corsOptions = {
    origin: CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    credentials: true,
};

console.log('[BOOT] cors.js fim', Date.now());