import logger from '#config/logger.js';

function mapMulterError(err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return { statusCode: 413, message: 'Ficheiro demasiado grande' };
    }

    return { statusCode: 400, message: 'Upload inválido' };
}

export function errorHandler(err, req, res, next) {
    logger.error(err.stack || err.message);

    if (err.name === 'MulterError') {
        const { statusCode, message } = mapMulterError(err);
        return res.status(statusCode).json({ success: false, error: message, code: statusCode });
    }

    const statusCode = err.statusCode || err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const message = statusCode >= 500 && isProduction ? 'Erro interno do servidor' : err.message;

    res.status(statusCode).json({ success: false, error: message, code: statusCode });
}
