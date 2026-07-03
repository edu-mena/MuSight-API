import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser'

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.status(200).send('Rota principal criada!');
});

export default app;