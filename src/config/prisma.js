import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não está definido nas variáveis de ambiente');
}

const { hostname, port, username, password, pathname } = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
    host: hostname,
    port: port ? Number(port) : undefined,
    user: decodeURIComponent(username),
    password: decodeURIComponent(password),
    database: pathname.replace(/^\//, ''),
});

const prisma = new PrismaClient({ adapter });

export default prisma;
