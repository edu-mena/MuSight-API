import { Router } from 'express';
import * as adminController from '#controllers/admin.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { parseIdParam } from '#middlewares/parseId.middleware.js';
import { requireAuth } from '#middlewares/auth.middleware.js';
import { requireAdmin } from '#middlewares/requireRole.middleware.js';
import { adminListArticlesQuerySchema } from '#validations/article.validations.js';
import { adminListDebatesQuerySchema } from '#validations/debate.validations.js';
import { rejectionSchema } from '#validations/common.validations.js';
import { adminListUsersQuerySchema, adminUpdateUserSchema } from '#validations/user.validations.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', adminController.getStats);

router.get('/users', validate(adminListUsersQuerySchema, 'query'), adminController.listUsers);
router.put('/users/:id', parseIdParam, validate(adminUpdateUserSchema), adminController.updateUser);
router.delete('/users/:id', parseIdParam, adminController.deleteUser);

router.get(
    '/articles',
    validate(adminListArticlesQuerySchema, 'query'),
    adminController.listArticles
);
router.put('/articles/:id/approve', parseIdParam, adminController.approveArticle);
router.put(
    '/articles/:id/reject',
    parseIdParam,
    validate(rejectionSchema),
    adminController.rejectArticle
);

router.get('/debates', validate(adminListDebatesQuerySchema, 'query'), adminController.listDebates);
router.put('/debates/:id/approve', parseIdParam, adminController.approveDebate);
router.put(
    '/debates/:id/reject',
    parseIdParam,
    validate(rejectionSchema),
    adminController.rejectDebate
);

export default router;
