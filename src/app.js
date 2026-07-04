import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from '#routes/auth.route.js';
import userRouter from '#routes/user.route.js';
import articleRouter from '#routes/article.route.js';
import researcherArticleRouter from '#routes/researcherArticle.route.js';
import debateRouter from '#routes/debate.route.js';
import researcherDebateRouter from '#routes/researcherDebate.route.js';
import commentRouter from '#routes/comment.route.js';
import adminRouter from '#routes/admin.route.js';
import wezaRouter from '#routes/weza.route.js';
import { errorHandler } from '#middlewares/errorHandler.middleware.js';
import { corsOptions } from '#config/cors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Rota principal criada!');
});

app.use(
    '/uploads',
    express.static(uploadsDir, {
        setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    })
);

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/articles', articleRouter);
app.use('/researcher/articles', researcherArticleRouter);
app.use('/debates', debateRouter);
app.use('/researcher/debates', researcherDebateRouter);
app.use('/comments', commentRouter);
app.use('/admin', adminRouter);
app.use('/weza', wezaRouter);

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Rota não encontrada', code: 404 });
});

app.use(errorHandler);

export default app;
