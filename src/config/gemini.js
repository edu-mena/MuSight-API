console.log('[BOOT] gemini.js início', Date.now());
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não está definido nas variáveis de ambiente');
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

console.log('[BOOT] gemini.js fim', Date.now());
export default genAI;
