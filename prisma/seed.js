import 'dotenv/config';
import prisma from '#config/prisma.js';
import { hashPassword } from '#services/auth.service.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@musight.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

async function main() {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
        console.log(`Conta admin já existe (${ADMIN_EMAIL}), nada a fazer.`);
        return;
    }

    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    await prisma.user.create({
        data: {
            name: 'Admin',
            email: ADMIN_EMAIL,
            passwordHash,
            role: 'admin',
            verified: true,
        },
    });

    console.log(`Conta admin criada: ${ADMIN_EMAIL}`);

    if (!process.env.ADMIN_PASSWORD) {
        console.warn(
            'AVISO: usaste a password por omissão do seed. Define ADMIN_PASSWORD no .env antes de correr isto em produção.'
        );
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
