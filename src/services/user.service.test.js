import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#config/prisma.js', () => ({
    default: {
        $transaction: vi.fn((callback) => callback(prismaMockForTx)),
        user: {
            update: vi.fn(),
        },
        userExpertise: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
    },
}));

const prisma = (await import('#config/prisma.js')).default;
const prismaMockForTx = prisma;
const { updateProfile, applyResearcher } = await import('./user.service.js');

beforeEach(() => {
    vi.clearAllMocks();
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
