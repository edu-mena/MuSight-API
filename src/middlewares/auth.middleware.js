import { verifyToken } from '#config/jwt.js';
import prisma from '#config/prisma.js';
import { toSafeUser } from '#utils/serializeUser.js';

export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = bearerToken || req.cookies?.token;

    if (!token) {
        return res
            .status(401)
            .json({ success: false, error: 'Autenticação necessária', code: 401 });
    }

    let payload;

    try {
        payload = verifyToken(token);
    } catch {
        return res
            .status(401)
            .json({ success: false, error: 'Token inválido ou expirado', code: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
        return res
            .status(401)
            .json({ success: false, error: 'Token inválido ou expirado', code: 401 });
    }

    if (user.suspended) {
        return res.status(403).json({ success: false, error: 'Conta suspensa', code: 403 });
    }

    req.user = toSafeUser(user);
    next();
}
