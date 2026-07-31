import { Router, IRouter } from 'express';
import * as inventoryController from './inventory.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import {
  addTransactionSchema,
  adjustStockSchema,
  getTransactionsSchema,
  getStockSchema,
  getBulkStockSchema,
  getStockReportSchema,
} from './inventory.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const staffRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
  APP_CONSTANTS.ROLES.STAFF,
];

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

// Base inventory route — returns stock report (product list with stock levels)
router.get(
  '/',
  authenticate,
  authorize(...staffRoles),
  validate(getStockReportSchema),
  inventoryController.getStockReport
);

// List transactions
router.get(
  '/transactions',
  authenticate,
  authorize(...staffRoles),
  validate(getTransactionsSchema),
  inventoryController.getTransactions
);

// Add transaction
router.post(
  '/transactions',
  authenticate,
  authorize(...adminRoles),
  validate(addTransactionSchema),
  inventoryController.addTransaction
);

// Get stock for a product
router.get(
  '/stock/:productId',
  authenticate,
  authorize(...staffRoles),
  validate(getStockSchema),
  inventoryController.getProductStock
);

// Get stock for multiple products
router.post(
  '/stock/bulk',
  authenticate,
  authorize(...staffRoles),
  validate(getBulkStockSchema),
  inventoryController.getBulkStock
);

// Stock report with low-stock filter
router.get(
  '/report',
  authenticate,
  authorize(...adminRoles),
  validate(getStockReportSchema),
  inventoryController.getStockReport
);

// Manual stock adjustment
router.post(
  '/adjust',
  authenticate,
  authorize(...adminRoles),
  validate(adjustStockSchema),
  inventoryController.adjustStock
);

export default router;
