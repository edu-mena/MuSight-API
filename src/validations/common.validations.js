import { z } from 'zod';

export const rejectionSchema = z.object({
    reason: z.string().min(1, 'Motivo obrigatório'),
});
