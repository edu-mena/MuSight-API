import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#config/gemini.js', () => ({
    default: {
        models: {
            generateContent: vi.fn(),
        },
    },
}));

vi.mock('#config/prisma.js', () => ({
    default: {
        wezaMessage: {
            create: vi.fn(),
        },
    },
}));

const genAI = (await import('#config/gemini.js')).default;
const prisma = (await import('#config/prisma.js')).default;
const { askWeza } = await import('./weza.service.js');

beforeEach(() => {
    vi.clearAllMocks();
});

describe('askWeza', () => {
    it('chama o Gemini com o system prompt da Weza e guarda a pergunta/resposta', async () => {
        genAI.models.generateContent.mockResolvedValue({ text: 'Resposta da Weza.' });
        prisma.wezaMessage.create.mockResolvedValue({});

        const result = await askWeza(1, 'O que é a inflação?');

        expect(genAI.models.generateContent).toHaveBeenCalledWith(
            expect.objectContaining({
                contents: 'O que é a inflação?',
                config: expect.objectContaining({
                    systemInstruction: expect.stringContaining('Weza'),
                }),
            })
        );
        expect(prisma.wezaMessage.create).toHaveBeenCalledWith({
            data: { userId: 1, question: 'O que é a inflação?', answer: 'Resposta da Weza.' },
        });
        expect(result).toEqual({ question: 'O que é a inflação?', answer: 'Resposta da Weza.' });
    });
});
