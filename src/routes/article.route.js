import { Router } from 'express';
import * as articleController from '#controllers/article.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { parseIdParam } from '#middlewares/parseId.middleware.js';
import { listArticlesQuerySchema } from '#validations/article.validations.js';

const router = Router();

router.get('/', validate(listArticlesQuerySchema, 'query'), articleController.listPublic);
router.get('/:id', parseIdParam, articleController.getPublicById);

export default router;
