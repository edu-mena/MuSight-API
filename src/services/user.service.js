import prisma from '#config/prisma.js';
import { toSafeUser } from '#utils/serializeUser.js';

function businessError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

export async function updateProfile(userId, data) {
    const { expertise, ...profileFields } = data;

    const user = await prisma.$transaction(async (tx) => {
        if (expertise) {
            await tx.userExpertise.deleteMany({ where: { userId } });

            if (expertise.length > 0) {
                await tx.userExpertise.createMany({
                    data: expertise.map((item) => ({
                        userId,
                        topic: item.topic,
                        level: item.level,
                    })),
                });
            }
        }

        return tx.user.update({
            where: { id: userId },
            data: profileFields,
            include: { expertise: true },
        });
    });

    return toSafeUser(user);
}

export async function applyResearcher(currentUser, { focusArea, motivation, portfolioUrl }) {
    if (currentUser.role !== 'user') {
        throw businessError('Só utilizadores comuns podem candidatar-se a pesquisador', 400);
    }

    if (currentUser.appliedForResearcher) {
        throw businessError('Já tens uma candidatura pendente', 409);
    }

    const user = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
            appliedForResearcher: true,
            researcherFocusArea: focusArea,
            researcherMotivation: motivation,
            portfolioUrl,
        },
    });

    return toSafeUser(user);
}

export async function listUsersForAdmin({ role, suspended, applied, search, page, limit }) {
    const where = {
        ...(role ? { role } : {}),
        ...(suspended !== undefined ? { suspended } : {}),
        ...(applied !== undefined ? { appliedForResearcher: applied } : {}),
        ...(search
            ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
            : {}),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
    ]);

    return { users: users.map(toSafeUser), total, page, limit };
}

export async function updateUserAsAdmin(targetId, data) {
    const existing = await prisma.user.findUnique({ where: { id: targetId } });

    if (!existing) {
        throw businessError('Utilizador não encontrado', 404);
    }

    const fields = { ...data };

    if (fields.role === 'researcher' && fields.appliedForResearcher === undefined) {
        fields.appliedForResearcher = false;
    }

    const user = await prisma.user.update({ where: { id: targetId }, data: fields });

    return toSafeUser(user);
}

export async function deleteUserAsAdmin(currentAdminId, targetId) {
    if (targetId === currentAdminId) {
        throw businessError('Não podes apagar a tua própria conta', 400);
    }

    const existing = await prisma.user.findUnique({ where: { id: targetId } });

    if (!existing) {
        throw businessError('Utilizador não encontrado', 404);
    }

    await prisma.user.delete({ where: { id: targetId } });
}
