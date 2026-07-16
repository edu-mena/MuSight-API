import bcrypt from 'bcryptjs';
import prisma from '#config/prisma.js';
import { signToken, verifyToken } from '#config/jwt.js';
import { sendMail } from '#config/mailer.js';
import { toSafeUser } from '#utils/serializeUser.js';

const SALT_ROUNDS = 12;

export function hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
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
    const confirmationLink = `${process.env.FRONTEND_URL}/auth/confirm-email?token=${confirmationToken}`;

    await sendMail({
        to: user.email,
        subject: 'Confirma o teu Email - MuSight',
        html: `
        <img
            src="https://musight-9iit.vercel.app/favicon.png"
            alt="MuSight"
            height="60"
            style="display:block;margin:0 auto 10px;"
        >
        <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                            <!-- Cabeçalho -->
                            <tr>
                                <td style="background:#FF7A00;padding:30px;text-align:center;">
                                    <h1 style="margin:0;color:#ffffff;font-size:28px;">
                                        MuSight
                                    </h1>
                                    <p style="margin:8px 0 0;color:#FFE5CC;font-size:14px;">
                                        Informação clara, múltiplas perspetivas
                                    </p>
                                </td>
                            </tr>

                            <!-- Conteúdo -->
                            <tr>
                                <td style="padding:40px 35px;color:#333333;">
                                    <h2 style="margin-top:0;color:#222222;">
                                        Confirmação de Email
                                    </h2>

                                    <p style="font-size:16px;line-height:1.6;">
                                        Olá <strong>${user.name}</strong>,
                                    </p>

                                    <p style="font-size:16px;line-height:1.6;">
                                        Bem-vindo ao <strong>MuSight</strong>.
                                    </p>

                                    <p style="font-size:16px;line-height:1.6;">
                                        Para ativares a tua conta e começares a explorar conteúdos com múltiplas perspetivas sobre África e Angola, confirma o teu endereço de email através do botão abaixo.
                                    </p>

                                    <p style="font-size:16px;line-height:1.6;">
                                        Este link permanecerá válido durante <strong>1 hora</strong>.
                                    </p>

                                    <div style="text-align:center;margin:35px 0;">
                                        <a href="${confirmationLink}"
                                        style="background:#FF7A00;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">
                                            Confirmar Email
                                        </a>
                                    </div>

                                    <p style="font-size:14px;color:#666666;line-height:1.6;">
                                        Caso o botão não funcione, copia e cola o seguinte endereço no teu navegador:
                                    </p>

                                    <p style="word-break:break-all;">
                                        <a href="${confirmationLink}" style="color:#FF7A00;">
                                            ${confirmationLink}
                                        </a>
                                    </p>

                                    <hr style="border:none;border-top:1px solid #eeeeee;margin:30px 0;">

                                    <p style="font-size:14px;color:#666666;line-height:1.6;">
                                        Se não criaste uma conta no MuSight, podes ignorar este email sem qualquer preocupação.
                                    </p>
                                </td>
                            </tr>

                            <!-- Rodapé -->
                            <tr>
                                <td style="background:#fafafa;padding:25px;text-align:center;border-top:1px solid #eeeeee;">
                                    <p style="margin:0;font-size:14px;color:#666666;">
                                        © ${new Date().getFullYear()} MuSight
                                    </p>
                                    <p style="margin:8px 0 0;font-size:13px;color:#999999;">
                                        Desenvolvido por Eduardo Mena
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </div>
        `,
    });
}

async function sendPasswordResetEmail(user) {
    const resetToken = signToken({ id: user.id, purpose: 'password_reset' }, '30m');
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    await sendMail({
        to: user.email,
        subject: 'Repor Password - MuSight',
        html: `
        <img
            src="https://musight-9iit.vercel.app/favicon.png"
            alt="MuSight"
            height="60"
            style="display:block;margin:0 auto 10px;"
        >
        <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">

                            <!-- Cabeçalho -->
                            <tr>
                                <td style="background:#FF7A00;padding:30px;text-align:center;">
                                    <h1 style="margin:0;color:#ffffff;font-size:28px;">
                                        MuSight
                                    </h1>
                                    <p style="margin:8px 0 0;color:#FFE5CC;font-size:14px;">
                                        Informação clara, múltiplas perspetivas
                                    </p>
                                </td>
                            </tr>

                            <!-- Conteúdo -->
                            <tr>
                                <td style="padding:40px 35px;color:#333333;">
                                    <h2 style="margin-top:0;color:#222222;">
                                        Reposição de Password
                                    </h2>

                                    <p style="font-size:16px;line-height:1.6;">
                                        Olá <strong>${user.name}</strong>,
                                    </p>

                                    <p style="font-size:16px;line-height:1.6;">
                                        Recebemos um pedido para repor a password associada à tua conta MuSight.
                                    </p>

                                    <p style="font-size:16px;line-height:1.6;">
                                        Para definires uma nova password, clica no botão abaixo. Este link permanecerá válido durante <strong>30 minutos</strong>.
                                    </p>

                                    <div style="text-align:center;margin:35px 0;">
                                        <a href="${resetLink}"
                                        style="background:#FF7A00;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;display:inline-block;">
                                            Repor Password
                                        </a>
                                    </div>

                                    <p style="font-size:14px;color:#666666;line-height:1.6;">
                                        Caso o botão não funcione, copia e cola o seguinte endereço no teu navegador:
                                    </p>

                                    <p style="word-break:break-all;">
                                        <a href="${resetLink}" style="color:#FF7A00;">
                                            ${resetLink}
                                        </a>
                                    </p>

                                    <hr style="border:none;border-top:1px solid #eeeeee;margin:30px 0;">

                                    <p style="font-size:14px;color:#666666;line-height:1.6;">
                                        Se não solicitaste esta alteração, podes ignorar este email. A tua password permanecerá inalterada.
                                    </p>
                                </td>
                            </tr>

                            <!-- Rodapé -->
                            <tr>
                                <td style="background:#fafafa;padding:25px;text-align:center;border-top:1px solid #eeeeee;">
                                    <p style="margin:0;font-size:14px;color:#666666;">
                                        © ${new Date().getFullYear()} MuSight
                                    </p>
                                    <p style="margin:8px 0 0;font-size:13px;color:#999999;">
                                        Desenvolvido por Eduardo Mena
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </div>
        `,
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
