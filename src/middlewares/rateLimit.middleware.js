import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Demasiadas tentativas de login. Tenta novamente dentro de um minuto.',
            code: 429,
        });
    },
});
