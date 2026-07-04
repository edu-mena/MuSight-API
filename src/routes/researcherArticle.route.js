import { Router } from 'express';
import * as articleController from '#controllers/article.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { parseIdParam } from '#middlewares/parseId.middleware.js';
import { requireAuth } from '#middlewares/auth.middleware.js';
import { requireRole } from '#middlewares/requireRole.middleware.js';
import { upload } from '#config/upload.js';
import { validateUploadedFiles } from '#middlewares/validateUpload.middleware.js';
import {
    createArticleSchema,
    updateArticleSchema,
    listArticlesQuerySchema,
} from '#validations/article.validations.js';

const router = Router();

const uploadFields = upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
]);

router.use(requireAuth, requireRole('researcher', 'expert'));

router.get('/', validate(listArticlesQuerySchema, 'query'), articleController.listOwn);
router.post(
    '/',
    uploadFields,
    validateUploadedFiles,
    validate(createArticleSchema),
    articleController.create
);
router.put(
    '/:id',
    parseIdParam,
    uploadFields,
    validateUploadedFiles,
    validate(updateArticleSchema),
    articleController.update
);
router.delete('/:id', parseIdParam, articleController.remove);

export default router;
