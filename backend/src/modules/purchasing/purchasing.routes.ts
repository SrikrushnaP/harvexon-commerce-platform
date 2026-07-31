import { Router, IRouter } from 'express';
import * as purchasingController from './purchasing.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import {
  createSupplierSchema,
  updateSupplierSchema,
  getSupplierByIdSchema,
  getSuppliersSchema,
  createPurchaseSchema,
  updatePurchaseStatusSchema,
  updatePurchaseItemsSchema,
  getPurchaseByIdSchema,
  getPurchasesSchema,
  cancelPurchaseSchema,
} from './purchasing.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

const adminOnly = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
];

// =====================
// Supplier Routes
// =====================

router.get(
  '/suppliers',
  authenticate,
  authorize(...adminRoles),
  validate(getSuppliersSchema),
  purchasingController.getSuppliers
);

router.get(
  '/suppliers/:id',
  authenticate,
  authorize(...adminRoles),
  validate(getSupplierByIdSchema),
  purchasingController.getSupplierById
);

router.post(
  '/suppliers',
  authenticate,
  authorize(...adminRoles),
  validate(createSupplierSchema),
  purchasingController.createSupplier
);

router.patch(
  '/suppliers/:id',
  authenticate,
  authorize(...adminRoles),
  validate(updateSupplierSchema),
  purchasingController.updateSupplier
);

router.delete(
  '/suppliers/:id',
  authenticate,
  authorize(...adminOnly),
  validate(getSupplierByIdSchema),
  purchasingController.deleteSupplier
);

// =====================
// Purchase Routes
// =====================

router.get(
  '/purchases',
  authenticate,
  authorize(...adminRoles),
  validate(getPurchasesSchema),
  purchasingController.getPurchases
);

router.get(
  '/purchases/:id',
  authenticate,
  authorize(...adminRoles),
  validate(getPurchaseByIdSchema),
  purchasingController.getPurchaseById
);

router.post(
  '/purchases',
  authenticate,
  authorize(...adminRoles),
  validate(createPurchaseSchema),
  purchasingController.createPurchase
);

router.patch(
  '/purchases/:id/status',
  authenticate,
  authorize(...adminRoles),
  validate(updatePurchaseStatusSchema),
  purchasingController.updatePurchaseStatus
);

router.patch(
  '/purchases/:id/items',
  authenticate,
  authorize(...adminRoles),
  validate(updatePurchaseItemsSchema),
  purchasingController.updatePurchaseItems
);

router.post(
  '/purchases/:id/cancel',
  authenticate,
  authorize(...adminRoles),
  validate(cancelPurchaseSchema),
  purchasingController.cancelPurchase
);

export default router;
