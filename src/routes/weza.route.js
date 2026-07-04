import { Router } from 'express';
import * as wezaController from '#controllers/weza.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { requireAuth } from '#middlewares/auth.middleware.js';
import { askWezaSchema } from '#validations/weza.validations.js';

const router = Router();

router.post('/', requireAuth, validate(askWezaSchema), wezaController.ask);

export default router;
