import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#config/prisma.js', () => ({
    default: {
        user: { count: vi.fn() },
        article: { count: vi.fn() },
        debate: { count: vi.fn() },
    },
}));

const prisma = (await import('#config/prisma.js')).default;
const { getAdminStats } = await import('./stats.service.js');

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getAdminStats', () => {
    it('agrega as contagens de todos os recursos', async () => {
        prisma.user.count
            .mockResolvedValueOnce(100)
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(3);
        prisma.article.count.mockResolvedValueOnce(5).mockResolvedValueOnce(40);
        prisma.debate.count.mockResolvedValueOnce(2).mockResolvedValueOnce(15);

        const stats = await getAdminStats();

        expect(stats).toEqual({
            totalUsers: 100,
            usersThisMonth: 10,
            articlesInReview: 5,
            debatesInReview: 2,
            totalPublished: 40,
            totalDebates: 15,
            pendingApplications: 3,
        });
    });
});
