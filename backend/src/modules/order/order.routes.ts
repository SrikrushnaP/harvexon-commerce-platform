import { Router, IRouter } from 'express';
import * as orderController from './order.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import {
  createOrderSchema,
  updateStatusSchema,
  updateItemsSchema,
  cancelOrderSchema,
} from './order.validators';
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

// List orders
router.get('/', authenticate, authorize(...staffRoles, APP_CONSTANTS.ROLES.CUSTOMER), orderController.getOrders);

// Get order by order number (must be before /:id to avoid path conflict)
router.get('/number/:orderNumber', authenticate, authorize(...staffRoles), orderController.getOrderByNumber);

// Get order by ID
router.get('/:id', authenticate, authorize(...staffRoles, APP_CONSTANTS.ROLES.CUSTOMER), orderController.getOrderById);

// Create order
router.post('/', authenticate, authorize(...staffRoles, APP_CONSTANTS.ROLES.CUSTOMER), validate(createOrderSchema), orderController.createOrder);

// Update order status
router.patch('/:id/status', authenticate, authorize(...staffRoles), validate(updateStatusSchema), orderController.updateOrderStatus);

// Update order items (admin/manager only — draft orders)
router.patch('/:id/items', authenticate, authorize(...adminRoles), validate(updateItemsSchema), orderController.updateOrderItems);

// Cancel order (admin/manager only)
router.post('/:id/cancel', authenticate, authorize(...adminRoles), validate(cancelOrderSchema), orderController.cancelOrder);

export default router;
