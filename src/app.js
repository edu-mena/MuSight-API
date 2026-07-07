import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import authRouter from '#routes/auth.route.js';
console.log('[BOOT] authRouter OK', Date.now());
import userRouter from '#routes/user.route.js';
console.log('[BOOT] userRouter OK', Date.now());
import articleRouter from '#routes/article.route.js';
console.log('[BOOT] articleRouter OK', Date.now());
import researcherArticleRouter from '#routes/researcherArticle.route.js';
console.log('[BOOT] researcherArticleRouter OK', Date.now());
import debateRouter from '#routes/debate.route.js';
console.log('[BOOT] debateRouter OK', Date.now());
import researcherDebateRouter from '#routes/researcherDebate.route.js';
console.log('[BOOT] researcherDebateRouter OK', Date.now());
import commentRouter from '#routes/comment.route.js';
console.log('[BOOT] commentRouter OK', Date.now());
import adminRouter from '#routes/admin.route.js';
console.log('[BOOT] adminRouter OK', Date.now());
import wezaRouter from '#routes/weza.route.js';
console.log('[BOOT] wezaRouter OK', Date.now());

import { errorHandler } from '#middlewares/errorHandler.middleware.js';
import { corsOptions } from '#config/cors.js';
console.log('[BOOT] cors config OK', Date.now());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => res.status(200).send('Rota principal criada!'));

app.use(
    '/uploads',
    express.static(uploadsDir, {
        setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    })
);

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/articles',