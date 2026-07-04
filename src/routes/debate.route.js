import { Router } from 'express';
import * as debateController from '#controllers/debate.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { parseIdParam } from '#middlewares/parseId.middleware.js';
import { requireAuth } from '#middlewares/auth.middleware.js';
import { optionalAuth } from '#middlewares/optionalAuth.middleware.js';
import { listDebatesQuerySchema, createCommentSchema } from '#validations/debate.validations.js';

const router = Router();

router.get('/', validate(listDebatesQuerySchema, 'query'), debateController.listPublic);
router.get('/:id', parseIdParam, optionalAuth, debateController.getPublicById);
router.post(
    '/:id/comments',
    parseIdParam,
    requireAuth,
    validate(createCommentSchema),
    debateController.addComment
);

export default router;
