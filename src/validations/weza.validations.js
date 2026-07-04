import { z } from 'zod';

export const askWezaSchema = z.object({
    question: z
        .string()
        .min(1, 'A pergunta não pode estar vazia')
        .max(2000, 'A pergunta deve ter no máximo 2000 caracteres'),
});
