import { Router, IRouter } from 'express';
import * as invoiceController from './invoice.controller';
import { authenticate, authorize } from '../auth';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

// Generate and download invoice PDF for an order
router.get('/:orderId', authenticate, authorize(...adminRoles), invoiceController.generateInvoice);

export default router;
