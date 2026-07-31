import { Router, IRouter } from 'express';
import * as settingsController from './settings.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import { createSettingsSchema, updateSettingsSchema } from './settings.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

// Public route - for Customer PWA / Delivery PWA
router.get('/public', settingsController.getPublicSettings);

// Protected routes (admin only)
router.get(
  '/',
  authenticate,
  authorize(APP_CONSTANTS.ROLES.SUPER_ADMIN, APP_CONSTANTS.ROLES.ADMIN),
  settingsController.getSettings
);

router.post(
  '/',
  authenticate,
  authorize(APP_CONSTANTS.ROLES.SUPER_ADMIN, APP_CONSTANTS.ROLES.ADMIN),
  validate(createSettingsSchema),
  settingsController.createSettings
);

router.patch(
  '/',
  authenticate,
  authorize(APP_CONSTANTS.ROLES.SUPER_ADMIN, APP_CONSTANTS.ROLES.ADMIN),
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

export default router;
