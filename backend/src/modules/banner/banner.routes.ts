import { Router, IRouter } from 'express';
import * as bannerController from './banner.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import { createBannerSchema, updateBannerSchema } from './banner.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
];

// ==================== PUBLIC ====================

router.get('/', bannerController.getActiveBanners);

// ==================== ADMIN ====================

router.get(
  '/all',
  authenticate,
  authorize(...adminRoles),
  bannerController.getAllBanners
);

router.post(
  '/',
  authenticate,
  authorize(...adminRoles),
  validate(createBannerSchema),
  bannerController.createBanner
);

router.patch(
  '/:id',
  authenticate,
  authorize(...adminRoles),
  validate(updateBannerSchema),
  bannerController.updateBanner
);

router.delete(
  '/:id',
  authenticate,
  authorize(...adminRoles),
  bannerController.deleteBanner
);

export default router;
