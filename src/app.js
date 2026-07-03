import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import authRouter from '#routes/auth.route.js';
import { errorHandler } from '#middlewares/errorHandler.middleware.js';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('Rota principal criada!');
});

app.use('/auth', authRouter);

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Rota não encontrada', code: 404 });
});

app.use(errorHandler);

export default app;