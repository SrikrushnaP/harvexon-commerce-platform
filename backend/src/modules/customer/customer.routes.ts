import { Router, IRouter } from 'express';
import * as customerController from './customer.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import {
  createCustomerGroupSchema, updateCustomerGroupSchema,
  createCustomerSchema, updateCustomerSchema,
  createAddressSchema, updateAddressSchema,
} from './customer.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

// ==================== CUSTOMER GROUP ROUTES ====================

// Public: list customer groups
router.get('/groups', customerController.getCustomerGroups);
router.get('/groups/:id', customerController.getCustomerGroupById);

// Admin: manage customer groups
router.post('/groups', authenticate, authorize(...adminRoles), validate(createCustomerGroupSchema), customerController.createCustomerGroup);
router.patch('/groups/:id', authenticate, authorize(...adminRoles), validate(updateCustomerGroupSchema), customerController.updateCustomerGroup);
router.delete('/groups/:id', authenticate, authorize(...adminRoles), customerController.deleteCustomerGroup);

// ==================== ADDRESS ROUTES ====================
// NOTE: Address routes MUST come before /:id routes to avoid path conflicts

// Admin: all address operations are protected
router.get('/addresses', authenticate, authorize(...adminRoles), customerController.getAddresses);
router.get('/addresses/:id', authenticate, authorize(...adminRoles), customerController.getAddressById);
router.post('/addresses', authenticate, authorize(...adminRoles), validate(createAddressSchema), customerController.createAddress);
router.patch('/addresses/:id', authenticate, authorize(...adminRoles), validate(updateAddressSchema), customerController.updateAddress);
router.delete('/addresses/:id', authenticate, authorize(...adminRoles), customerController.deleteAddress);

// ==================== CUSTOMER ROUTES ====================

// Admin: all customer operations are protected
router.get('/', authenticate, authorize(...adminRoles), customerController.getCustomers);
router.get('/:id', authenticate, authorize(...adminRoles), customerController.getCustomerById);
router.post('/', authenticate, authorize(...adminRoles), validate(createCustomerSchema), customerController.createCustomer);
router.patch('/:id', authenticate, authorize(...adminRoles), validate(updateCustomerSchema), customerController.updateCustomer);
router.delete('/:id', authenticate, authorize(...adminRoles), customerController.deleteCustomer);

export default router;
