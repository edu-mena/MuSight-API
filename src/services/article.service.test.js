import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#config/upload.js', () => ({
    audioDir: '/fake/uploads/audio',
    imagesDir: '/fake/uploads/images',
}));

vi.mock('node:fs/promises', () => ({
    default: { unlink: vi.fn().mockResolvedValue() },
}));

vi.mock('#config/prisma.js', () => ({
    default: {
        $transaction: vi.fn((callback) => callback(prismaMockForTx)),
        article: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        articleLevel: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        articleKeyTerm: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        articleReference: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        user: {
            update: vi.fn(),
        },
    },
}));

const prisma = (await import('#config/prisma.js')).default;
const prismaMockForTx = prisma;
const fs = (await import('node:fs/promises')).default;
const {
    listPublicArticles,
    getPublicArticleById,
    listOwnArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    listArticlesForAdmin,
    approveArticle,
    rejectArticle,
} = await import('./article.service.js');

beforeEach(() => {
    vi.clearAllMocks();
    prisma.article.count.mockResolvedValue(0);
});

describe('listPublicArticles', () => {
    it('filtra sempre por status = publicado', async () => {
        prisma.article.findMany.mockResolvedValue([]);

        await listPublicArticles({ page: 1, limit: 10 });

        expect(prisma.article.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { status: 'publicado' } })
        );
    });

    it('inclui a categoria no filtro quando fornecida', async () => {
        prisma.article.findMany.mockResolvedValue([]);

        await listPublicArticles({ category: 'Economia', page: 1, limit: 10 });

        expect(prisma.article.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { status: 'publicado', category: 'Economia' } })
        );
    });
});

describe('listOwnArticles', () => {
    it('filtra sempre por authorId, sem exigir status = publicado', async () => {
        prisma.article.findMany.mockResolvedValue([]);

        await listOwnArticles(1, { page: 1, limit: 10 });

        expect(prisma.article.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { authorId: 1 } })
        );
    });
});

describe('getPublicArticleById', () => {
    it('lança 404 se o artigo não existir', async () => {
        prisma.article.findUnique.mockResolvedValue(null);

        await expect(getPublicArticleById(1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lança 404 se o artigo existir mas não estiver publicado', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1, status: 'em_revisao', views: 0 });

        await expect(getPublicArticleById(1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('incrementa as views e devolve o valor já atualizado', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1, status: 'publicado', views: 5 });
        prisma.article.update.mockResolvedValue({});

        const result = await getPublicArticleById(1);

        expect(prisma.article.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { views: { increment: 1 } },
        });
        expect(result.views).toBe(6);
    });
});

describe('createArticle', () => {
    it('cria o artigo com status em_revisao e incrementa contributions do autor', async () => {
        prisma.article.create.mockResolvedValue({ id: 1, status: 'em_revisao' });

        await createArticle(1, {
            title: 'Título',
            category: 'Economia',
            levels: [{ level: 'basico', label: 'Básico', content: 'x' }],
            keyTerms: [],
            references: [],
        });

        expect(prisma.article.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ authorId: 1, status: 'em_revisao' }),
            })
        );
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { contributions: { increment: 1 } },
        });
    });

    it('sem ficheiros, guarda hasAudio false e audioSrc/image nulos', async () => {
        prisma.article.create.mockResolvedValue({ id: 1 });

        await createArticle(1, {
            title: 'Título',
            category: 'Economia',
            levels: [{ level: 'basico', label: 'Básico', content: 'x' }],
            keyTerms: [],
            references: [],
        });

        expect(prisma.article.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ hasAudio: false, audioSrc: null, image: null }),
            })
        );
    });

    it('com ficheiros de áudio e imagem, guarda hasAudio true e os caminhos construídos', async () => {
        prisma.article.create.mockResolvedValue({ id: 1 });

        await createArticle(
            1,
            {
                title: 'Título',
                category: 'Economia',
                audioDuration: '3:45',
                levels: [{ level: 'basico', label: 'Básico', content: 'x' }],
                keyTerms: [],
                references: [],
            },
            {
                audio: [{ filename: 'abc.mp3' }],
                image: [{ filename: 'def.jpg' }],
            }
        );

        expect(prisma.article.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    hasAudio: true,
                    audioDuration: '3:45',
                    audioSrc: '/uploads/audio/abc.mp3',
                    image: '/uploads/images/def.jpg',
                }),
            })
        );
    });
});

describe('updateArticle', () => {
    it('lança 404 se o artigo não for do autor', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1, authorId: 2, status: 'rascunho' });

        await expect(updateArticle(1, 1, { title: 'Novo' })).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it('lança 400 se o artigo já estiver publicado', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1, authorId: 1, status: 'publicado' });

        await expect(updateArticle(1, 1, { title: 'Novo' })).rejects.toMatchObject({
            statusCode: 400,
        });
    });

    it('substitui levels/keyTerms/references quando enviados', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1, authorId: 1, status: 'em_revisao' });
        prisma.article.update.mockResolvedValue({ id: 1 });

        await updateArticle(1, 1, {
            levels: [{ level: 'basico', label: 'Básico', content: 'x' }],
        });

        expect(prisma.articleLevel.deleteMany).toHaveBeenCalledWith({ where: { articleId: 1 } });
        expect(prisma.articleLevel.createMany).toHaveBeenCalled();
        expect(prisma.articleKeyTerm.deleteMany).not.toHaveBeenCalled();
    });

    it('ao substituir a imagem, apaga o ficheiro antigo do disco', async () => {
        prisma.article.findUnique.mockResolvedValue({
            id: 1,
            authorId: 1,
            status: 'em_revisao',
            image: '/uploads/images/antiga.jpg',
        });
        prisma.article.update.mockResolvedValue({ id: 1 });

        await updateArticle(1, 1, {}, { image: [{ filename: 'nova.jpg' }] });

        expect(fs.unlink).toHaveBeenCalledWith(path.join('/fake/uploads/images', 'antiga.jpg'));
        expect(prisma.article.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ image: '/uploads/images/nova.jpg' }),
            })
        );
    });

    it('não apaga nada se não houver imagem antiga para substituir', async () => {
        prisma.article.findUnique.mockResolvedValue({
            id: 1,
            authorId: 1,
            status: 'em_revisao',
            image: null,
        });
        prisma.article.update.mockResolvedValue({ id: 1 });

        await updateArticle(1, 1, {}, { image: [{ filename: 'nova.jpg' }] });

        expect(fs.unlink).not.toHaveBeenCalled();
    });
});

describe('deleteArticle', () => {
    it('lança 404 se o artigo não for do autor', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1, authorId: 2, status: 'rascunho' });

        await expect(deleteArticle(1, 1)).rejects.toMatchObject({ statusCode: 404 });
        expect(prisma.article.delete).not.toHaveBeenCalled();
    });

    it('lança 400 se o artigo já estiver publicado', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1, authorId: 1, status: 'publicado' });

        await expect(deleteArticle(1, 1)).rejects.toMatchObject({ statusCode: 400 });
        expect(prisma.article.delete).not.toHaveBeenCalled();
    });

    it('apaga o artigo quando é do autor e não está publicado', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1, authorId: 1, status: 'em_revisao' });

        await deleteArticle(1, 1);

        expect(prisma.article.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});

describe('listArticlesForAdmin', () => {
    it('nunca devolve passwordHash do autor', async () => {
        prisma.article.findMany.mockResolvedValue([
            { id: 1, author: { id: 2, name: 'A', passwordHash: 'hash' } },
        ]);

        const result = await listArticlesForAdmin({ page: 1, limit: 20 });

        expect(result.articles[0].author).not.toHaveProperty('passwordHash');
    });
});

describe('approveArticle / rejectArticle', () => {
    it('approveArticle lança 404 se o artigo não existir', async () => {
        prisma.article.findUnique.mockResolvedValue(null);

        await expect(approveArticle(1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('approveArticle define status publicado e limpa rejectionReason', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1 });
        prisma.article.update.mockResolvedValue({ id: 1, status: 'publicado' });

        await approveArticle(1);

        expect(prisma.article.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'publicado', rejectionReason: null },
        });
    });

    it('rejectArticle define status recusado com o motivo', async () => {
        prisma.article.findUnique.mockResolvedValue({ id: 1 });
        prisma.article.update.mockResolvedValue({ id: 1, status: 'recusado' });

        await rejectArticle(1, 'Falta rigor jornalístico');

        expect(prisma.article.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: { status: 'recusado', rejectionReason: 'Falta rigor jornalístico' },
        });
    });
});
