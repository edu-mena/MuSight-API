import { z } from 'zod';

const expertiseItemSchema = z.object({
    topic: z.string().min(1, 'Tópico obrigatório'),
    level: z.enum(['basico', 'intermedio', 'avancado']),
});

export const updateProfileSchema = z
    .object({
        name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').optional(),
        bio: z.string().optional(),
        academicLevel: z.string().optional(),
        academicArea: z.string().optional(),
        institution: z.string().optional(),
        profession: z.string().optional(),
        organization: z.string().optional(),
        website: z.url('URL inválido').optional(),
        linkedin: z.url('URL inválido').optional(),
        expertise: z.array(expertiseItemSchema).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Envia pelo menos um campo para atualizar',
    });

export const applyResearcherSchema = z.object({
    focusArea: z.string().min(2, 'Área de foco obrigatória'),
    motivation: z.string().min(20, 'A motivação deve ter pelo menos 20 caracteres'),
    portfolioUrl: z.url('URL inválido').optional(),
});

export const adminListUsersQuerySchema = z.object({
    role: z.enum(['user', 'researcher', 'expert', 'admin']).optional(),
    suspended: z.coerce.boolean().optional(),
    applied: z.coerce.boolean().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminUpdateUserSchema = z
    .object({
        role: z.enum(['user', 'researcher', 'expert', 'admin']).optional(),
        verified: z.boolean().optional(),
        suspended: z.boolean().optional(),
        appliedForResearcher: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Envia pelo menos um campo para atualizar',
    });
