import express from 'express';

const app = express();

app.use(helmet());

app.get('/', (req, res) => {
    res.status(200).send('Rota principal criada!');
});

export default app;