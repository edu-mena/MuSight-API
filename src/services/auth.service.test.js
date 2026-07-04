import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken } from '#config/jwt.js';

vi.mock('#config/prisma.js', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('#config/mailer.js', () => ({
    sendMail: vi.fn(),
}));

const prisma = (await import('#config/prisma.js')).default;
const { sendMail } = await import('#config/mailer.js');
const {
    hashPassword,
    comparePassword,
    register,
    login,
    confirmEmail,
    resendConfirmation,
    getUserById,
} = await import('./auth.service.js');

beforeEach(() => {
    vi.clearAllMocks();
});

describe('hashPassword / comparePassword', () => {
    it('produz um hash diferente da password original', async () => {
        const hash = await hashPassword('minhaPassword123');
        expect(hash).not.toBe('minhaPassword123');
    });

    it('comparePassword resolve true para a password correta', async () => {
        const hash = await hashPassword('minhaPassword123');
        await expect(comparePassword('minhaPassword123', hash)).resolves.toBe(true);
    });

    it('comparePassword resolve false para a password errada', async () => {
        const hash = await hashPassword('minhaPassword123');
        await expect(comparePassword('outraPassword', hash)).resolves.toBe(false);
    });
});

describe('register', () => {
    it('lança 409 se o email já está registado', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'existe@teste.com' });

        await expect(
            register({ name: 'A', email: 'existe@teste.com', password: 'password123' })
        ).rejects.toMatchObject({ statusCode: 409 });

        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('cria o user, envia o email de confirmação, e nunca devolve passwordHash', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
            id: 1,
            name: 'A',
            email: 'novo@teste.com',
            passwordHash: 'hash-guardado',
            role: 'user',
            verified: false,
        });

        const result = await register({
            name: 'A',
            email: 'novo@teste.com',
            password: 'password123',
        });

        expect(result).not.toHaveProperty('passwordHash');
        expect(sendMail).toHaveBeenCalledOnce();
    });
});

describe('login', () => {
    it('lança 401 com mensagem genérica se o user não existe', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await expect(login({ email: 'x@x.com', password: '123' })).rejects.toMatchObject({
            statusCode: 401,
            message: 'Credenciais inválidas',
        });
    });

    it('lança 401 com a MESMA mensagem genérica se a password está errada', async () => {
        const passwordHash = await hashPassword('certo123456');
        prisma.user.findUnique.mockResolvedValue({ id: 1, passwordHash, verified: true });

        await expect(login({ email: 'x@x.com', password: 'errada' })).rejects.toMatchObject({
            statusCode: 401,
            message: 'Credenciais inválidas',
        });
    });

    it('lança 403 se o email ainda não está confirmado', async () => {
        const passwordHash = await hashPassword('certo123456');
        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: 'x@x.com',
            passwordHash,
            verified: false,
        });

        await expect(login({ email: 'x@x.com', password: 'certo123456' })).rejects.toMatchObject({
            statusCode: 403,
        });
    });

    it('devolve token e user seguro em caso de sucesso', async () => {
        const passwordHash = await hashPassword('certo123456');
        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: 'x@x.com',
            passwordHash,
            role: 'user',
            verified: true,
        });

        const result = await login({ email: 'x@x.com', password: 'certo123456' });

        expect(result.token).toEqual(expect.any(String));
        expect(result.user).not.toHaveProperty('passwordHash');
    });
});

describe('resendConfirmation (não deve revelar se a conta existe)', () => {
    it('não envia email se o user não existe', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await resendConfirmation({ email: 'naoexiste@teste.com' });

        expect(sendMail).not.toHaveBeenCalled();
    });

    it('não envia email se o user já está verificado', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, verified: true });

        await resendConfirmation({ email: 'x@x.com' });

        expect(sendMail).not.toHaveBeenCalled();
    });

    it('envia um novo email se o user existe e não está verificado', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            name: 'A',
            email: 'x@x.com',
            verified: false,
        });

        await resendConfirmation({ email: 'x@x.com' });

        expect(sendMail).toHaveBeenCalledOnce();
    });
});

describe('confirmEmail', () => {
    it('rejeita um token com purpose errado', async () => {
        const token = signToken({ id: 1, purpose: 'password_reset' }, '1h');

        await expect(confirmEmail(token)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('marca o user como verificado com um token válido', async () => {
        const token = signToken({ id: 1, purpose: 'email_verification' }, '1h');
        prisma.user.update.mockResolvedValue({ id: 1, verified: true, passwordHash: 'hash' });

        const result = await confirmEmail(token);

        expect(result.verified).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { verified: true },
        });
    });
});

describe('getUserById', () => {
    it('lança 404 se o user não existe', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await expect(getUserById(999)).rejects.toMatchObject({ statusCode: 404 });
    });
});
