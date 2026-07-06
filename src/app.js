import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

console.log('[BOOT] início', Date.now());

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('[BOOT] LISTENING', PORT, Date.now());
});