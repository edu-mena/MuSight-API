import fs from 'node:fs/promises';
import { fileTypeFromFile } from 'file-type';

const ALLOWED_MIMES = {
    audio: ['audio/mpeg', 'audio/wav'],
    image: ['image/jpeg', 'image/png', 'image/webp'],
};

export async function validateUploadedFiles(req, res, next) {
    const files = [...(req.files?.audio ?? []), ...(req.files?.image ?? [])];

    try {
        for (const file of files) {
            const detected = await fileTypeFromFile(file.path);
            const allowed = ALLOWED_MIMES[file.fieldname];

            if (!detected || !allowed.includes(detected.mime)) {
                await fs.unlink(file.path);
                return res.status(400).json({
                    success: false,
                    error: `O ficheiro enviado em "${file.fieldname}" não é um tipo válido`,
                    code: 400,
                });
            }
        }

        next();
    } catch (err) {
        next(err);
    }
}
