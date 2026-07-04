import { z } from 'zod';
import { CATEGORIES } from './categories.js';

function parseJsonArray(val) {
    if (typeof val !== 'string') {
        return val;
    }

    try {
        return JSON.parse(val);
    } catch {
        return val;
    }
}

const articleLevelSchema = z.object({
    level: z.enum(['basico', 'intermedio', 'avancado']),
    label: z.string().min(1, 'Label obrigatório'),
    sublabel: z.string().optional(),
    content: z.string().min(1, 'Conteúdo obrigatório'),
});

const articleKeyTermSchema = z.object({
    term: z.string().min(1, 'Termo obrigatório'),
    definition: z.string().min(1, 'Definição obrigatória'),
});

const articleReferenceSchema = z.object({
    label: z.string().min(1, 'Label obrigatório'),
    url: z.url('URL inválido').optional(),
});

export const createArticleSchema = z
    .object({
        title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
        category: z.enum(CATEGORIES),
        excerpt: z.string().max(500).optional(),
        articleDate: z.coerce.date().optional(),
        audioDuration: z.string().optional(),
        levels: z.preprocess(
            parseJsonArray,
            z.array(articleLevelSchema).min(1, 'Pelo menos um nível é obrigatório')
        ),
        keyTerms: z.preprocess(parseJsonArray, z.array(articleKeyTermSchema).default([])),
        references: z.preprocess(parseJsonArray, z.array(articleReferenceSchema).default([])),
    })
    .refine((data) => data.levels.some((level) => level.level === 'basico'), {
        message: 'O nível "básico" é obrigatório',
        path: ['levels'],
    });

export const updateArticleSchema = z
    .object({
        title: z.string().min(3).optional(),
        category: z.enum(CATEGORIES).optional(),
        excerpt: z.string().max(500).optional(),
        articleDate: z.coerce.date().optional(),
        audioDuration: z.string().optional(),
        levels: z.preprocess(parseJsonArray, z.array(articleLevelSchema).optional()),
        keyTerms: z.preprocess(parseJsonArray, z.array(articleKeyTermSchema).optional()),
        references: z.preprocess(parseJsonArray, z.array(articleReferenceSchema).optional()),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Envia pelo menos um campo para atualizar',
    });

export const listArticlesQuerySchema = z.object({
    category: z.enum(CATEGORIES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminListArticlesQuerySchema = z.object({
    status: z.enum(['rascunho', 'em_revisao', 'publicado', 'recusado']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
