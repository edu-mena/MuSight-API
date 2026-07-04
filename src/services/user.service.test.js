import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#config/prisma.js', () => ({
    default: {
        $transaction: vi.fn((callback) => callback(prismaMockForTx)),
        user: {
            update: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
            delete: vi.fn(),
        },
        userExpertise: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
    },
}));

const prisma = (await import('#config/prisma.js')).default;
const prismaMockForTx = prisma;
const { updateProfile, applyResearcher, listUsersForAdmin, updateUserAsAdmin, deleteUserAsAdmin } =
    await import('./user.service.js');

beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.count.mockResolvedValue(0);
});

describe('updateProfile', () => {
    it('atualiza só os campos do perfil quando expertise não é enviado', async () => {
        prisma.user.update.mockResolvedValue({
            id: 1,
            name: 'Novo Nome',
            passwordHash: 'hash',
        });

        const result = await updateProfile(1, { name: 'Novo Nome' });

        expect(prisma.userExpertise.deleteMany).not.toHaveBeenCalled();
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { name: 'Novo Nome' },
            include: { expertise: true },
        });
        expect(result).not.toHaveProperty('passwordHash');
    });

    it('substitui totalmente a expertise (delete + createMany) quando enviada', async () => {
        prisma.user.update.mockResolvedValue({ id: 1, passwordHash: 'hash' });

        await updateProfile(1, { expertise: [{ topic: 'Economia', level: 'avancado' }] });

        expect(prisma.userExpertise.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
        expect(prisma.userExpertise.createMany).toHaveBeenCalledWith({
            data: [{ userId: 1, topic: 'Economia', level: 'avancado' }],
        });
    });

    it('limpa a expertise sem recriar nada se enviada como array vazio', async () => {
        prisma.user.update.mockResolvedValue({ id: 1, passwordHash: 'hash' });

        await updateProfile(1, { expertise: [] });

        expect(prisma.userExpertise.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
        expect(prisma.userExpertise.createMany).not.toHaveBeenCalled();
    });
});

describe('applyResearcher', () => {
    it('lança 400 se o utilizador já não for um "user" comum', async () => {
        const currentUser = { id: 1, role: 'researcher', appliedForResearcher: false };

        await expect(
            applyResearcher(currentUser, { focusArea: 'IA', motivation: 'x'.repeat(25) })
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('lança 409 se já existir uma candidatura pendente', async () => {
        const currentUser = { id: 1, role: 'user', appliedForResearcher: true };

        await expect(
            applyResearcher(currentUser, { focusArea: 'IA', motivation: 'x'.repeat(25) })
        ).rejects.toMatchObject({ statusCode: 409 });

        expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('marca appliedForResearcher e guarda os dados da candidatura', async () => {
        const currentUser = { id: 1, role: 'user', appliedForResearcher: false };
        prisma.user.update.mockResolvedValue({
            id: 1,
            appliedForResearcher: true,
            passwordHash: 'hash',
        });

        const result = await applyResearcher(currentUser, {
            focusArea: 'IA',
            motivation: 'x'.repeat(25),
            portfolioUrl: 'https://exemplo.com',
        });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: {
                appliedForResearcher: true,
                researcherFocusArea: 'IA',
                researcherMotivation: 'x'.repeat(25),
                portfolioUrl: 'https://exemplo.com',
            },
        });
        expect(result).not.toHaveProperty('passwordHash');
    });
});

describe('listUsersForAdmin', () => {
    it('nunca devolve passwordHash', async () => {
        prisma.user.findMany.mockResolvedValue([{ id: 1, name: 'A', passwordHash: 'hash' }]);

        const result = await listUsersForAdmin({ page: 1, limit: 20 });

        expect(result.users[0]).not.toHaveProperty('passwordHash');
    });

    it('constrói o filtro OR de pesquisa quando "search" é enviado', async () => {
        prisma.user.findMany.mockResolvedValue([]);

        await listUsersForAdmin({ search: 'eduardo', page: 1, limit: 20 });

        expect(prisma.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    OR: [{ name: { contains: 'eduardo' } }, { email: { contains: 'eduardo' } }],
                },
            })
        );
    });
});

describe('updateUserAsAdmin', () => {
    it('lança 404 se o utilizador não existir', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await expect(updateUserAsAdmin(1, { verified: true })).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it('ao aprovar como researcher, limpa appliedForResearcher automaticamente', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'user' });
        prisma.user.update.mockResolvedValue({ id: 1, role: 'researcher', passwordHash: 'hash' });

        await updateUserAsAdmin(1, { role: 'researcher' });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { role: 'researcher', appliedForResearcher: false },
        });
    });

    it('não sobrepõe appliedForResearcher se vier explícito no pedido', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 1, role: 'user' });
        prisma.user.update.mockResolvedValue({ id: 1, role: 'researcher', passwordHash: 'hash' });

        await updateUserAsAdmin(1, { role: 'researcher', appliedForResearcher: true });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { role: 'researcher', appliedForResearcher: true },
        });
    });
});

describe('deleteUserAsAdmin', () => {
    it('lança 400 se o admin tentar apagar a própria conta', async () => {
        await expect(deleteUserAsAdmin(1, 1)).rejects.toMatchObject({ statusCode: 400 });
        expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('lança 404 se o utilizador alvo não existir', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        await expect(deleteUserAsAdmin(1, 2)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('apaga o utilizador alvo quando é válido', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 2 });

        await deleteUserAsAdmin(1, 2);

        expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    });
});
