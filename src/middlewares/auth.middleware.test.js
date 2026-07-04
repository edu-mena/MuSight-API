import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken } from '#config/jwt.js';

vi.mock('#config/prisma.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

const prisma = (await import('#config/prisma.js')).default;
const { requireAuth } = await import('./auth.middleware.js');

function createRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('requireAuth', () => {
    it('responde 401 se não houver token', async () => {
        const req = { headers: {}, cookies: {} };
        const res = createRes();
        const next = vi.fn();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('responde 401 se o token for inválido', async () => {
        const req = { headers: { authorization: 'Bearer token-invalido' }, cookies: {} };
        const res = createRes();
        const next = vi.fn();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('responde 401 se o utilizador do token já não existir', async () => {
        const token = signToken({ id: 999, email: 'x@x.com', role: 'user' });
        prisma.user.findUnique.mockResolvedValue(null);

        const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
        const res = createRes();
        const next = vi.fn();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('responde 403 se o utilizador estiver suspenso', async () => {
        const token = signToken({ id: 1, email: 'x@x.com', role: 'user' });
        prisma.user.findUnique.mockResolvedValue({ id: 1, suspended: true, passwordHash: 'hash' });

        const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
        const res = createRes();
        const next = vi.fn();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('define req.user (sem passwordHash) e chama next() quando tudo está válido', async () => {
        const token = signToken({ id: 1, email: 'x@x.com', role: 'user' });
        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: 'x@x.com',
            role: 'user',
            suspended: false,
            passwordHash: 'hash',
        });

        const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
        const res = createRes();
        const next = vi.fn();

        await requireAuth(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(req.user).not.toHaveProperty('passwordHash');
        expect(req.user.id).toBe(1);
    });
});
