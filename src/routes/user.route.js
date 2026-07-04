import { Router } from 'express';
import * as userController from '#controllers/user.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { requireAuth } from '#middlewares/auth.middleware.js';
import { updateProfileSchema, applyResearcherSchema } from '#validations/user.validations.js';

const router = Router();

router.put('/profile', requireAuth, validate(updateProfileSchema), userController.updateProfile);
router.post(
    '/apply-researcher',
    requireAuth,
    validate(applyResearcherSchema),
    userController.applyResearcher
);

export default router;
