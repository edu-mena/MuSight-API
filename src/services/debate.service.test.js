import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#config/prisma.js', () => ({
    default: {
        $transaction: vi.fn((arg) =>
            Array.isArray(arg) ? Promise.all(arg) : arg(prismaMockForTx)
        ),
        debate: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        comment: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            count: vi.fn(),
        },
        commentLike: {
            findUnique: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
        user: {
            update: vi.fn(),
        },
    },
}));

const prisma = (await import('#config/prisma.js')).default;
const prismaMockForTx = prisma;
const {
    listPublicDebates,
    getPublicDebateById,
    listOwnDebates,
    createDebate,
    deleteDebate,
    commentOnDebate,
    toggleCommentLike,
    listDebatesForAdmin,
    approveDebate,
    rejectDebate,
} = await import('./debate.service.js');

beforeEach(() => {
    vi.clearAllMocks();
    prisma.debate.count.mockResolvedValue(0);
});

describe('listPublicDebates', () => {
    it('filtra sempre por status = publicado', async () => {
        prisma.debate.findMany.mockResolvedValue([]);

        await listPublicDebates({ page: 1, limit: 10 });

        expect(prisma.debate.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { status: 'publicado' } })
        );
    });
});

describe('getPublicDebateById', () => {
    it('lança 404 se o debate não existir ou não estiver publicado', async () => {
        prisma.debate.findUnique.mockResolvedValue(null);

        await expect(getPublicDebateById(1, null)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('calcula userLiked como false quando não há utilizador autenticado', async () => {
        prisma.debate.findUnique.mockResolvedValue({
            id: 1,
            status: 'publicado',
            comments: [
                {
                    id: 1,
                    user: { id: 2, name: 'A', passwordHash: 'hash' },
                    likedBy: [{ userId: 2, commentId: 1 }],
                },
            ],
        });

        const result = await getPublicDebateById(1, null);

        expect(result.comments[0].userLiked).toBe(false);
        expect(result.comments[0].author).not.toHaveProperty('passwordHash');
    });

    it('calcula userLiked como true quando o utilizador autenticado deu like', async () => {
        prisma.debate.findUnique.mockResolvedValue({
            id: 1,
            status: 'publicado',
            comments: [
                {
                    id: 1,
                    user: { id: 2, name: 'A', passwordHash: 'hash' },
                    likedBy: [{ userId: 5, commentId: 1 }],
                },
            ],
        });

        const result = await getPublicDebateById(1, 5);

        expect(result.comments[0].userLiked).toBe(true);
    });
});

describe('createDebate', () => {
    it('força status em_revisao independentemente do que for enviado, e conta os especialistas convidados', async () => {
        prisma.debate.create.mockResolvedValue({ id: 1 });

        await createDebate(1, {
            title: 'Título',
            category: 'Economia',
            summary: 'Resumo',
            stance: 'neutro',
            invitedExperts: ['Especialista A', 'Especialista B'],
        });

        expect(prisma.debate.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ status: 'em_revisao', expertsCount: 2 }),
            })
        );
    });
});

describe('deleteDebate', () => {
    it('lança 404 se o debate não for do autor', async () => {
        prisma.debate.findUnique.mockResolvedValue({ id: 1, authorId: 2, status: 'rascunho' });

        await expect(deleteDebate(1, 1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lança 400 se o debate já estiver publicado', async () => {
        prisma.debate.findUnique.mockResolvedValue({ id: 1, authorId: 1, status: 'publicado' });

        await expect(deleteDebate(1, 1)).rejects.toMatchObject({ statusCode: 400 });
    });
});

describe('commentOnDebate', () => {
    it('lança 404 se o debate não existir ou não estiver publicado', async () => {
        prisma.debate.findUnique.mockResolvedValue(null);

        await expect(commentOnDebate(1, 1, { text: 'x', side: 'neutro' })).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it('incrementa participants e debatesCount só na primeira vez deste utilizador no debate', async () => {
        prisma.debate.findUnique.mockResolvedValue({ id: 1, status: 'publicado' });
        prisma.comment.count.mockResolvedValue(0);
        prisma.comment.create.mockResolvedValue({ id: 1 });

        await commentOnDebate(1, 5, { text: 'Concordo', side: 'favor' });

        expect(prisma.debate.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { participants: { increment: 1 } },
        });
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 5 },
            data: { debatesCount: { increment: 1 } },
        });
    });

    it('não incrementa nada se o utilizador já tinha comentado antes neste debate', async () => {
        prisma.debate.findUnique.mockResolvedValue({ id: 1, status: 'publicado' });
        prisma.comment.count.mockResolvedValue(1);
        prisma.comment.create.mockResolvedValue({ id: 2 });

        await commentOnDebate(1, 5, { text: 'Outra vez', side: 'favor' });

        expect(prisma.debate.update).not.toHaveBeenCalled();
        expect(prisma.user.update).not.toHaveBeenCalled();
    });
});

describe('toggleCommentLike', () => {
    it('lança 404 se o comentário não existir', async () => {
        prisma.comment.findUnique.mockResolvedValue(null);

        await expect(toggleCommentLike(1, 1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('adiciona o like quando ainda não existia', async () => {
        prisma.comment.findUnique.mockResolvedValue({ id: 1, likes: 0 });
        prisma.commentLike.findUnique.mockResolvedValue(null);
        prisma.comment.update.mockResolvedValue({ id: 1, likes: 1 });

        const result = await toggleCommentLike(1, 5);

        expect(prisma.commentLike.create).toHaveBeenCalledWith({
            data: { userId: 5, commentId: 1 },
        });
        expect(result).toEqual({ liked: true, likes: 1 });
    });

    it('remove o like quando já existia (toggle)', async () => {
        prisma.comment.findUnique.mockResolvedValue({ id: 1, likes: 1 });
        prisma.commentLike.findUnique.mockResolvedValue({ userId: 5, commentId: 1 });
        prisma.comment.update.mockResolvedValue({ id: 1, likes: 0 });

        const result = await toggleCommentLike(1, 5);

        expect(prisma.commentLike.delete).toHaveBeenCalledWith({
            where: { userId_commentId: { userId: 5, commentId: 1 } },
        });
        expect(result).toEqual({ liked: false, likes: 0 });
    });
});

describe('listDebatesForAdmin', () => {
    it('nunca devolve passwordHash do autor', async () => {
        prisma.debate.findMany.mockResolvedValue([
            { id: 1, author: { id: 2, name: 'A', passwordHash: 'hash' } },
        ]);

        const result = await listDebatesForAdmin({ page: 1, limit: 20 });

        expect(result.debates[0].author).not.toHaveProperty('passwordHash');
    });
});

describe('approveDebate / rejectDebate', () => {
    it('approveDebate lança 404 se o debate não existir', async () => {
        prisma.debate.findUnique.mockResolvedValue(null);

        await expect(approveDebate(1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('approveDebate define status publicado e desliga hot', async () => {
        prisma.debate.findUnique.mockResolvedValue({ id: 1 });
        prisma.debate.update.mockResolvedValue({ id: 1, status: 'publicado' });

        await approveDebate(1);

        expect(prisma.debate.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'publicado', hot: false, rejectionReason: null },
        });
    });

    it('rejectDebate define status recusado com o motivo', async () => {
        prisma.debate.findUnique.mockResolvedValue({ id: 1 });
        prisma.debate.update.mockResolvedValue({ id: 1, status: 'recusado' });

        await rejectDebate(1, 'Fora do tema');

        expect(prisma.debate.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'recusado', rejectionReason: 'Fora do tema' },
        });
    });
});

describe('listOwnDebates', () => {
    it('filtra sempre por authorId', async () => {
        prisma.debate.findMany.mockResolvedValue([]);

        await listOwnDebates(1, { page: 1, limit: 10 });

        expect(prisma.debate.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { authorId: 1 } })
        );
    });
});
