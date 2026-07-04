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
