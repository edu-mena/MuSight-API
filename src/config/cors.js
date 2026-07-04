const CORS_ORIGINS = process.env.CORS_ORIGINS;

if (!CORS_ORIGINS) {
    throw new Error('CORS_ORIGINS não está definido nas variáveis de ambiente');
}

export const corsOptions = {
    origin: CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    credentials: true,
};
