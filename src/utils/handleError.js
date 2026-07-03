import logger from '#config/logger.js';

export function handleControllerError(err, res, next) {
    if (err.statusCode) {
        logger.warn(err.message);
        return res.status(err.statusCode).json({ success: false, error: err.message, code: err.statusCode });
    }

    next(err);
}
