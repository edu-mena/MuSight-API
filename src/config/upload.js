import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
export const audioDir = path.join(uploadsDir, 'audio');
export const imagesDir = path.join(uploadsDir, 'images');

fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

const UPLOAD_MAX_SIZE_MB = Number(process.env.UPLOAD_MAX_SIZE_MB) || 50;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, file.fieldname === 'audio' ? audioDir : imagesDir);
    },
    filename: (req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString('hex');
        cb(null, `${randomName}${path.extname(file.originalname)}`);
    },
});

export const upload = multer({
    storage,
    // fileSize tem de ser inteiro — com um valor decimal, o busboy trunca o ficheiro
    // silenciosamente no limite em vez de rejeitar com LIMIT_FILE_SIZE.
    limits: { fileSize: Math.floor(UPLOAD_MAX_SIZE_MB * 1024 * 1024) },
});
