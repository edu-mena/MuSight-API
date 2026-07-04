import genAI from '#config/gemini.js';
import prisma from '#config/prisma.js';

const SYSTEM_PROMPT =
    'Chamas-te Weza, a assistente jornalística inteligente da Rede Girassol — o jornal digital de referência em Angola. Responde sempre em português europeu/angolano, de forma factual, equilibrada e concisa (2-5 parágrafos). Nunca inventes factos; se não tiveres certeza, diz isso claramente.';

export async function askWeza(userId, question) {
    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
            systemInstruction: SYSTEM_PROMPT,
        },
    });

    const answer = response.text;

    await prisma.wezaMessage.create({
        data: { userId, question, answer },
    });

    return { question, answer };
}
