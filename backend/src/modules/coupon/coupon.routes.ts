import { Router, IRouter } from 'express';
import * as couponController from './coupon.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  getCouponsSchema,
  couponIdParamSchema,
} from './coupon.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

// ==================== CUSTOMER ENDPOINTS ====================

router.post(
  '/validate',
  authenticate,
  validate(validateCouponSchema),
  couponController.validateCoupon
);

router.get(
  '/available',
  authenticate,
  couponController.getAvailableCoupons
);

// ==================== ADMIN CRUD ====================

router.get(
  '/',
  authenticate,
  authorize(...adminRoles),
  validate(getCouponsSchema),
  couponController.getCoupons
);

router.get(
  '/:id',
  authenticate,
  authorize(...adminRoles),
  validate(couponIdParamSchema),
  couponController.getCouponById
);

router.post(
  '/',
  authenticate,
  authorize(...adminRoles),
  validate(createCouponSchema),
  couponController.createCoupon
);

router.patch(
  '/:id',
  authenticate,
  authorize(...adminRoles),
  validate(updateCouponSchema),
  couponController.updateCoupon
);

router.delete(
  '/:id',
  authenticate,
  authorize(...adminRoles),
  validate(couponIdParamSchema),
  couponController.deleteCoupon
);

export default router;
