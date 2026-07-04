import { verifyToken } from '#config/jwt.js';
import prisma from '#config/prisma.js';
import { toSafeUser } from '#utils/serializeUser.js';

export async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = bearerToken || req.cookies?.token;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        req.user = user && !user.suspended ? toSafeUser(user) : null;
    } catch {
        req.user = null;
    }

    next();
}
