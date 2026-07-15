console.log('[BOOT] prisma.js início', Date.now());
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
    connectionLimit: 3,     // reduz de 10 (default) para algo compatível com plano compartilhado
    connectTimeout: 10000,  // timeout explícito de conexão em ms
});

const prisma = new PrismaClient({ adapter });

console.log('[BOOT] prisma.js fim', Date.now());
export default prisma;
