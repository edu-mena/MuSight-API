export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Autenticação necessária', code: 401 });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Sem permissão para aceder a este recurso', code: 403 });
        }

        next();
    };
}

export const requireAdmin = requireRole('admin');
