import { Router } from 'express';
import * as debateController from '#controllers/debate.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { parseIdParam } from '#middlewares/parseId.middleware.js';
import { requireAuth } from '#middlewares/auth.middleware.js';
import { requireRole } from '#middlewares/requireRole.middleware.js';
import { createDebateSchema, listDebatesQuerySchema } from '#validations/debate.validations.js';

const router = Router();

router.use(requireAuth, requireRole('researcher', 'expert'));

router.get('/', validate(listDebatesQuerySchema, 'query'), debateController.listOwn);
router.post('/', validate(createDebateSchema), debateController.create);
router.delete('/:id', parseIdParam, debateController.remove);

export default router;
