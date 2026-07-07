console.log('[BOOT] wezaRouter OK', Date.now());

import { errorHandler } from '#middlewares/errorHandler.middleware.js';
import { corsOptions } from '#config/cors.js';
console.log('[BOOT] cors config OK', Date.now());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
console.log('[BOOT] uploadsDir resolvido:', uploadsDir, Date.now());

const app = express();
console.log('[BOOT] express() OK', Date.now());

app.use(helmet());
console.log('[BOOT] helmet OK', Date.now());
app.use(morgan('dev'));
console.log('[BOOT] morgan OK', Date.now());
app.use(cors(corsOptions));
console.log('[BOOT] cors middleware OK', Date.now());
app.use(cookieParser());
console.log('[BOOT] cookieParser OK', Date.now());
app.use(express.json());
console.log('[BOOT] express.json OK', Date.now());

app.get('/', (req, res) => res.status(200).send('Rota principal criada!'));

app.use(
    '/uploads',
    express.static(uploadsDir, {
        setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    })
);
console.log('[BOOT] uploads static OK', Date.now());

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/articles', articleRouter);
app.use('/researcher/articles', researcherArticleRouter);
app.use('/debates', debateRouter);
app.use('/researcher/debates', researcherDebateRouter);
app.use('/comments', commentRouter);
app.use('/admin', adminRouter);
app.use('/weza', wezaRouter);
console.log('[BOOT] todas as rotas montadas OK', Date.now());

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Rota não encontrada', code: 404 });
});

app.use(errorHandler);
console.log('[BOOT] errorHandler montado OK', Date.now());

console.log('[BOOT] app.js fim', Date.now());
export default app;