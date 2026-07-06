import express from 'express';
import cors from 'cors';
import { corsOptions } from '#config/cors.js';

console.log('[BOOT] início', Date.now());

const app = express();
app.use(cors(corsOptions));

app.get('/', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('[BOOT] LISTENING', PORT, Date.now());
});