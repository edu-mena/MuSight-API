import { verifyToken } from '#config/jwt.js';

export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = bearerToken || req.cookies?.token;

    if (!token) {
        return res.status(401).json({ success: false, error: 'Autenticação necessária', code: 401 });
    }

    try {
        const payload = verifyToken(token);
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    } catch {
        return res.status(401).json({ success: false, error: 'Token inválido ou expirado', code: 401 });
    }
}
