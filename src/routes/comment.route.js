import { Router } from 'express';
import * as commentController from '#controllers/comment.controller.js';
import { parseIdParam } from '#middlewares/parseId.middleware.js';
import { requireAuth } from '#middlewares/auth.middleware.js';

const router = Router();

router.post('/:id/like', parseIdParam, requireAuth, commentController.toggleLike);

export default router;
