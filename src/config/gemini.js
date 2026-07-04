import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não está definido nas variáveis de ambiente');
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export default genAI;
