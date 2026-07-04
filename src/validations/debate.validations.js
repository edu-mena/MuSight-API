import { z } from 'zod';
import { CATEGORIES } from './categories.js';

export const createDebateSchema = z.object({
    title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
    category: z.enum(CATEGORIES),
    summary: z.string().max(300, 'O resumo deve ter no máximo 300 caracteres'),
    stance: z.enum(['favor', 'neutro', 'contra']).default('neutro'),
    initialArgument: z.string().optional(),
    invitedExperts: z
        .array(z.string().min(1))
        .max(3, 'Máximo de 3 especialistas convidados')
        .default([]),
});

export const listDebatesQuerySchema = z.object({
    category: z.enum(CATEGORIES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminListDebatesQuerySchema = z.object({
    status: z.enum(['rascunho', 'em_revisao', 'publicado', 'recusado']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createCommentSchema = z.object({
    text: z.string().min(1, 'Comentário não pode estar vazio'),
    side: z.enum(['favor', 'neutro', 'contra']).default('neutro'),
});
