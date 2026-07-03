import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    email: z.email('Email inválido'),
    password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres'),
});

export const loginSchema = z.object({
    email: z.email('Email inválido'),
    password: z.string().min(1, 'A password é obrigatória'),
});

export const resendConfirmationSchema = z.object({
    email: z.email('Email inválido'),
});

export const forgotPasswordSchema = z.object({
    email: z.email('Email inválido'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres'),
});
