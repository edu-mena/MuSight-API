import fs from 'node:fs/promises';
import path from 'node:path';
import prisma from '#config/prisma.js';
import { audioDir, imagesDir } from '#config/upload.js';
import { toSafeUser } from '#utils/serializeUser.js';

const FULL_INCLUDE = { levels: true, keyTerms: true, references: true };

function businessError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getOwnArticleOrThrow(authorId, articleId) {
    const article = await prisma.article.findUnique({ where: { id: articleId } });

    if (!article || article.authorId !== authorId) {
        throw businessError('Artigo não encontrado', 404);
    }

    return article;
}

function buildFileUrl(kind, filename) {
    return `/uploads/${kind}/${filename}`;
}

async function deleteStoredFile(kind, storedUrl) {
    if (!storedUrl) {
        return;
    }

    const dir = kind === 'audio' ? audioDir : imagesDir;
    await fs.unlink(path.join(dir, path.basename(storedUrl))).catch(() => {});
}

export async function listPublicArticles({ category, page, limit }) {
    const where = { status: 'publicado', ...(category ? { category } : {}) };

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.article.count({ where }),
    ]);

    return { articles, total, page, limit };
}

export async function getPublicArticleById(id) {
    const article = await prisma.article.findUnique({ where: { id }, include: FULL_INCLUDE });

    if (!article || article.status !== 'publicado') {
        throw businessError('Artigo não encontrado', 404);
    }

    await prisma.article.update({ where: { id }, data: { views: { increment: 1 } } });

    return { ...article, views: article.views + 1 };
}

export async function listOwnArticles(authorId, { page, limit }) {
    const where = { authorId };

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.article.count({ where }),
    ]);

    return { articles, total, page, limit };
}

export async function createArticle(
    authorId,
    { title, category, excerpt, articleDate, audioDuration, levels, keyTerms, references },
    files = {}
) {
    const audioFile = files.audio?.[0];
    const imageFile = files.image?.[0];

    const article = await prisma.article.create({
        data: {
            authorId,
            title,
            category,
            excerpt,
            articleDate,
            status: 'em_revisao',
            hasAudio: Boolean(audioFile),
            audioDuration: audioFile ? (audioDuration ?? null) : null,
            audioSrc: audioFile ? buildFileUrl('audio', audioFile.filename) : null,
            image: imageFile ? buildFileUrl('images', imageFile.filename) : null,
            levels: { create: levels },
            keyTerms: { create: keyTerms },
            references: { create: references },
        },
        include: FULL_INCLUDE,
    });

    await prisma.user.update({
        where: { id: authorId },
        data: { contributions: { increment: 1 } },
    });

    return article;
}

export async function updateArticle(authorId, articleId, data, files = {}) {
    const article = await getOwnArticleOrThrow(authorId, articleId);

    if (article.status === 'publicado') {
        throw businessError('Não é possível editar um artigo já publicado', 400);
    }

    const { levels, keyTerms, references, audioDuration, ...fields } = data;
    const audioFile = files.audio?.[0];
    const imageFile = files.image?.[0];

    if (audioFile) {
        fields.hasAudio = true;
        fields.audioDuration = audioDuration ?? null;
        fields.audioSrc = buildFileUrl('audio', audioFile.filename);
    }

    if (imageFile) {
        fields.image = buildFileUrl('images', imageFile.filename);
    }

    const updated = await prisma.$transaction(async (tx) => {
        if (levels) {
            await tx.articleLevel.deleteMany({ where: { articleId } });
            await tx.articleLevel.createMany({
                data: levels.map((level) => ({ ...level, articleId })),
            });
        }

        if (keyTerms) {
            await tx.articleKeyTerm.deleteMany({ where: { articleId } });
            await tx.articleKeyTerm.createMany({
                data: keyTerms.map((term) => ({ ...term, articleId })),
            });
        }

        if (references) {
            await tx.articleReference.deleteMany({ where: { articleId } });
            await tx.articleReference.createMany({
                data: references.map((reference) => ({ ...reference, articleId })),
            });
        }

        return tx.article.update({
            where: { id: articleId },
            data: fields,
            include: FULL_INCLUDE,
        });
    });

    if (audioFile && article.audioSrc) {
        await deleteStoredFile('audio', article.audioSrc);
    }

    if (imageFile && article.image) {
        await deleteStoredFile('images', article.image);
    }

    return updated;
}

export async function deleteArticle(authorId, articleId) {
    const article = await getOwnArticleOrThrow(authorId, articleId);

    if (article.status === 'publicado') {
        throw businessError('Não é possível apagar um artigo já publicado', 400);
    }

    await prisma.article.delete({ where: { id: articleId } });
    await deleteStoredFile('audio', article.audioSrc);
    await deleteStoredFile('images', article.image);
}

export async function listArticlesForAdmin({ status, page, limit }) {
    const where = status ? { status } : {};

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { author: true },
        }),
        prisma.article.count({ where }),
    ]);

    return {
        articles: articles.map((article) => ({ ...article, author: toSafeUser(article.author) })),
        total,
        page,
        limit,
    };
}

export async function approveArticle(articleId) {
    const article = await prisma.article.findUnique({ where: { id: articleId } });

    if (!article) {
        throw businessError('Artigo não encontrado', 404);
    }

    return prisma.article.update({
        where: { id: articleId },
        data: { status: 'publicado', rejectionReason: null },
    });
}

export async function rejectArticle(articleId, reason) {
    const article = await prisma.article.findUnique({ where: { id: articleId } });

    if (!article) {
        throw businessError('Artigo não encontrado', 404);
    }

    return prisma.article.update({
        where: { id: articleId },
        data: { status: 'recusado', rejectionReason: reason },
    });
}
