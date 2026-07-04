import prisma from '#config/prisma.js';
import { toSafeUser } from '#utils/serializeUser.js';

function businessError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getOwnDebateOrThrow(authorId, debateId) {
    const debate = await prisma.debate.findUnique({ where: { id: debateId } });

    if (!debate || debate.authorId !== authorId) {
        throw businessError('Debate não encontrado', 404);
    }

    return debate;
}

export async function listPublicDebates({ category, page, limit }) {
    const where = { status: 'publicado', ...(category ? { category } : {}) };

    const [debates, total] = await Promise.all([
        prisma.debate.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.debate.count({ where }),
    ]);

    return { debates, total, page, limit };
}

export async function getPublicDebateById(id, currentUserId) {
    const debate = await prisma.debate.findUnique({
        where: { id },
        include: {
            invitedExperts: true,
            comments: { include: { user: true, likedBy: true } },
        },
    });

    if (!debate || debate.status !== 'publicado') {
        throw businessError('Debate não encontrado', 404);
    }

    return {
        ...debate,
        comments: debate.comments.map(({ likedBy, user, ...comment }) => ({
            ...comment,
            author: toSafeUser(user),
            userLiked: currentUserId
                ? likedBy.some((like) => like.userId === currentUserId)
                : false,
        })),
    };
}

export async function listOwnDebates(authorId, { page, limit }) {
    const where = { authorId };

    const [debates, total] = await Promise.all([
        prisma.debate.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.debate.count({ where }),
    ]);

    return { debates, total, page, limit };
}

export async function createDebate(
    authorId,
    { title, category, summary, stance, initialArgument, invitedExperts }
) {
    return prisma.debate.create({
        data: {
            authorId,
            title,
            category,
            summary,
            stance,
            initialArgument,
            status: 'em_revisao',
            expertsCount: invitedExperts.length,
            invitedExperts: { create: invitedExperts.map((name) => ({ name })) },
        },
        include: { invitedExperts: true },
    });
}

export async function deleteDebate(authorId, debateId) {
    const debate = await getOwnDebateOrThrow(authorId, debateId);

    if (debate.status === 'publicado') {
        throw businessError('Não é possível apagar um debate já publicado', 400);
    }

    await prisma.debate.delete({ where: { id: debateId } });
}

export async function commentOnDebate(debateId, userId, { text, side }) {
    const debate = await prisma.debate.findUnique({ where: { id: debateId } });

    if (!debate || debate.status !== 'publicado') {
        throw businessError('Debate não encontrado', 404);
    }

    const isFirstComment = (await prisma.comment.count({ where: { debateId, userId } })) === 0;

    return prisma.$transaction(async (tx) => {
        const comment = await tx.comment.create({
            data: { debateId, userId, content: text, side },
        });

        if (isFirstComment) {
            await tx.debate.update({
                where: { id: debateId },
                data: { participants: { increment: 1 } },
            });
            await tx.user.update({
                where: { id: userId },
                data: { debatesCount: { increment: 1 } },
            });
        }

        return comment;
    });
}

export async function toggleCommentLike(commentId, userId) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
        throw businessError('Comentário não encontrado', 404);
    }

    const existingLike = await prisma.commentLike.findUnique({
        where: { userId_commentId: { userId, commentId } },
    });

    if (existingLike) {
        const [, updatedComment] = await prisma.$transaction([
            prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } }),
            prisma.comment.update({ where: { id: commentId }, data: { likes: { decrement: 1 } } }),
        ]);

        return { liked: false, likes: updatedComment.likes };
    }

    const [, updatedComment] = await prisma.$transaction([
        prisma.commentLike.create({ data: { userId, commentId } }),
        prisma.comment.update({ where: { id: commentId }, data: { likes: { increment: 1 } } }),
    ]);

    return { liked: true, likes: updatedComment.likes };
}

export async function listDebatesForAdmin({ status, page, limit }) {
    const where = status ? { status } : {};

    const [debates, total] = await Promise.all([
        prisma.debate.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { author: true },
        }),
        prisma.debate.count({ where }),
    ]);

    return {
        debates: debates.map((debate) => ({ ...debate, author: toSafeUser(debate.author) })),
        total,
        page,
        limit,
    };
}

export async function approveDebate(debateId) {
    const debate = await prisma.debate.findUnique({ where: { id: debateId } });

    if (!debate) {
        throw businessError('Debate não encontrado', 404);
    }

    return prisma.debate.update({
        where: { id: debateId },
        data: { status: 'publicado', hot: false, rejectionReason: null },
    });
}

export async function rejectDebate(debateId, reason) {
    const debate = await prisma.debate.findUnique({ where: { id: debateId } });

    if (!debate) {
        throw businessError('Debate não encontrado', 404);
    }

    return prisma.debate.update({
        where: { id: debateId },
        data: { status: 'recusado', rejectionReason: reason },
    });
}
