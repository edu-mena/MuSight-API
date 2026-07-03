import logger from '#config/logger.js';

export function errorHandler(err, req, res, next) {
    logger.error(err.stack || err.message);

    const statusCode = err.statusCode || err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const message = statusCode >= 500 && isProduction ? 'Erro interno do servidor' : err.message;

    res.status(statusCode).json({ success: false, error: message, code: statusCode });
}
