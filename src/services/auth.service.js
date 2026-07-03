import bcrypt from 'bcryptjs';
import prisma from '#config/prisma.js';
import { signToken, verifyToken } from '#config/jwt.js';
import { sendMail } from '#config/mailer.js';

const SALT_ROUNDS = 12;

export function hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}

function toSafeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}

function businessError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function verifyPurposeToken(token, expectedPurpose) {
    let payload;

    try {
        payload = verifyToken(token);
    } catch {
        throw businessError('Link inválido ou expirado', 400);
    }

    if (payload.purpose !== expectedPurpose) {
        throw businessError('Token inválido para esta operação', 400);
    }

    return payload;
}

async function sendConfirmationEmail(user) {
    const confirmationToken = signToken({ id: user.id, purpose: 'email_verification' }, '1h');
    const confirmationLink = `${process.env.API_URL}/auth/confirm/${confirmationToken}`;

    await sendMail({
        to: user.email,
        subject: 'Confirma o teu email - MuSight',
        html: `<p>Olá ${user.name},</p><p>Confirma o teu email clicando no link abaixo (válido por 1 hora):</p><p><a href="${confirmationLink}">${confirmationLink}</a></p>`,
    });
}

async function sendPasswordResetEmail(user) {
    const resetToken = signToken({ id: user.id, purpose: 'password_reset' }, '30m');
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendMail({
        to: user.email,
        subject: 'Repor password - MuSight',
        html: `<p>Olá ${user.name},</p><p>Recebemos um pedido para repor a tua password. Clica no link abaixo (válido por 30 minutos):</p><p><a href="${resetLink}">${resetLink}</a></p><p>Se não foste tu, ignora este email.</p>`,
    });
}

export async function register({ name, email, password }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        throw businessError('Email já está em uso', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: { name, email, passwordHash },
    });

    await sendConfirmationEmail(user);

    return toSafeUser(user);
}

export async function resendConfirmation({ email }) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.verified) {
        return;
    }

    await sendConfirmationEmail(user);
}

export async function getUserById(id) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
        throw businessError('Utilizador não encontrado', 404);
    }

    return toSafeUser(user);
}

export async function confirmEmail(token) {
    const payload = verifyPurposeToken(token, 'email_verification');

    const user = await prisma.user.update({
        where: { id: payload.id },
        data: { verified: true },
    });

    return toSafeUser(user);
}

export async function forgotPassword({ email }) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return;
    }

    await sendPasswordResetEmail(user);
}

export async function resetPassword({ token, password }) {
    const payload = verifyPurposeToken(token, 'password_reset');

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
        where: { id: payload.id },
        data: { passwordHash },
    });
}

export async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw businessError('Credenciais inválidas', 401);
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
        throw businessError('Credenciais inválidas', 401);
    }

    if (!user.verified) {
        throw businessError('Email ainda não confirmado', 403);
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return { token, user: toSafeUser(user) };
}
