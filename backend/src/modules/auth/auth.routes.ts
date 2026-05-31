import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import * as authSchemas from './auth.schema';

const router = Router();

router.post('/signup', validate(authSchemas.signupSchema), authController.signup);
router.post('/login', validate(authSchemas.loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.post('/forgot-password', validate(authSchemas.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(authSchemas.resetPasswordSchema), authController.resetPassword);

export default router;
