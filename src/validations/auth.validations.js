import { z } from 'zod';

// --- campos partilhados ---------------------------------------------------

const email = z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'Email demasiado longo')
    .pipe(z.email('Email inválido'));

const name = z
    .string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(100, 'O nome não pode exceder 100 caracteres')
    .regex(/^[\p{L}\p{M} '’.-]+$/u, 'O nome contém caracteres inválidos');

const password = z
    .string()
    .min(8, 'A password deve ter pelo menos 8 caracteres')
    .max(72, 'A password não pode exceder 72 caracteres');

// --- schemas ---------------------------------------------------------------

export const registerSchema = z.object({
    name,
    email,
    password,
});

export const loginSchema = z.object({
    email,
    password: z.string().min(1, 'A password é obrigatória').max(72),
});

export const resendConfirmationSchema = z.object({
    email,
});

export const forgotPasswordSchema = z.object({
    email,
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token é obrigatório').max(2048, 'Token inválido'),
    password,
});

export const googleLoginSchema = z.object({
    credential: z
        .string()
        .min(1, 'Token do Google em falta')
        .max(4096, 'Token do Google inválido'),
});