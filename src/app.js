import express from 'express';
import cors from 'cors';
import { corsOptions } from '#config/cors.js';
import { errorHandler } from '#middlewares/errorHandler.middleware.js';
import authRouter from '#routes/auth.route.js';

console.log('[BOOT] início', Date.now());

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => res.send('ok'));
app.use('/auth', authRouter);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('[BOOT] LISTENING', PORT, Date.now());
});