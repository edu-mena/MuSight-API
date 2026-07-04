import { Router } from 'express';
import * as authController from '#controllers/auth.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { requireAuth } from '#middlewares/auth.middleware.js';
import {
    registerSchema,
    loginSchema,
    resendConfirmationSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '#validations/auth.validations.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.get('/confirm/:token', authController.confirmEmail);
router.post(
    '/resend-confirmation',
    validate(resendConfirmationSchema),
    authController.resendConfirmation
);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
