import { Router } from 'express';
import * as userController from './user.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import * as userSchemas from './user.schema';

const router = Router();

router.use(requireAuth);

router.get('/me', userController.getMe);
router.patch('/me', validate(userSchemas.updateProfileSchema), userController.updateMe);
router.delete('/me', validate(userSchemas.deleteAccountSchema), userController.deleteMe);
router.get('/me/export', userController.exportMe);

export default router;
