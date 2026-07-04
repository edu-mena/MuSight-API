import prisma from '#config/prisma.js';

export async function getAdminStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
        totalUsers,
        usersThisMonth,
        articlesInReview,
        debatesInReview,
        totalPublished,
        totalDebates,
        pendingApplications,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.article.count({ where: { status: 'em_revisao' } }),
        prisma.debate.count({ where: { status: 'em_revisao' } }),
        prisma.article.count({ where: { status: 'publicado' } }),
        prisma.debate.count(),
        prisma.user.count({ where: { appliedForResearcher: true } }),
    ]);

    return {
        totalUsers,
        usersThisMonth,
        articlesInReview,
        debatesInReview,
        totalPublished,
        totalDebates,
        pendingApplications,
    };
}
