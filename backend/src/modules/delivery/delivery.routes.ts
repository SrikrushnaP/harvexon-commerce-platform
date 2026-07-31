import { Router, IRouter } from 'express';
import * as deliveryController from './delivery.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import {
  createStaffSchema,
  updateStaffSchema,
  updateLocationSchema,
  getStaffSchema,
  staffIdParamSchema,
  createAssignmentSchema,
  updateAssignmentStatusSchema,
  getAssignmentsSchema,
  assignmentIdParamSchema,
  orderIdParamSchema,
  staffAssignmentsSchema,
} from './delivery.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

const staffRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
  APP_CONSTANTS.ROLES.STAFF,
];

const deliveryRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
  APP_CONSTANTS.ROLES.DELIVERY,
];

// ===== Delivery Staff Routes =====

// GET /api/delivery/staff - List delivery staff (admin/manager)
router.get(
  '/staff',
  authenticate,
  authorize(...adminRoles),
  validate(getStaffSchema),
  deliveryController.getDeliveryStaff
);

// GET /api/delivery/staff/:id - Get delivery staff by ID (admin/manager/delivery)
router.get(
  '/staff/:id',
  authenticate,
  authorize(...deliveryRoles),
  validate(staffIdParamSchema),
  deliveryController.getDeliveryStaffById
);

// POST /api/delivery/staff - Create delivery staff (admin/manager)
router.post(
  '/staff',
  authenticate,
  authorize(...adminRoles),
  validate(createStaffSchema),
  deliveryController.createDeliveryStaff
);

// PATCH /api/delivery/staff/:id - Update delivery staff (admin/manager)
router.patch(
  '/staff/:id',
  authenticate,
  authorize(...adminRoles),
  validate(updateStaffSchema),
  deliveryController.updateDeliveryStaff
);

// DELETE /api/delivery/staff/:id - Delete delivery staff (admin only)
router.delete(
  '/staff/:id',
  authenticate,
  authorize(APP_CONSTANTS.ROLES.SUPER_ADMIN, APP_CONSTANTS.ROLES.ADMIN),
  validate(staffIdParamSchema),
  deliveryController.deleteDeliveryStaff
);

// PATCH /api/delivery/staff/:id/availability - Toggle availability (admin/manager/delivery)
router.patch(
  '/staff/:id/availability',
  authenticate,
  authorize(...deliveryRoles),
  validate(staffIdParamSchema),
  deliveryController.toggleAvailability
);

// PATCH /api/delivery/staff/:id/location - Update GPS location (delivery)
router.patch(
  '/staff/:id/location',
  authenticate,
  authorize(APP_CONSTANTS.ROLES.DELIVERY, ...adminRoles),
  validate(updateLocationSchema),
  deliveryController.updateLocation
);

// ===== Delivery Assignment Routes =====

// GET /api/delivery/assignments - List assignments (admin/manager/staff)
router.get(
  '/assignments',
  authenticate,
  authorize(...staffRoles),
  validate(getAssignmentsSchema),
  deliveryController.getAssignments
);

// GET /api/delivery/assignments/order/:orderId - Get assignment by order (admin/manager/staff)
router.get(
  '/assignments/order/:orderId',
  authenticate,
  authorize(...staffRoles),
  validate(orderIdParamSchema),
  deliveryController.getAssignmentByOrder
);

// GET /api/delivery/assignments/staff/:staffId - Get staff assignments (admin/manager/delivery)
router.get(
  '/assignments/staff/:staffId',
  authenticate,
  authorize(...deliveryRoles),
  validate(staffAssignmentsSchema),
  deliveryController.getStaffAssignments
);

// GET /api/delivery/assignments/:id - Get assignment by ID (admin/manager/staff/delivery)
router.get(
  '/assignments/:id',
  authenticate,
  authorize(...staffRoles, APP_CONSTANTS.ROLES.DELIVERY),
  validate(assignmentIdParamSchema),
  deliveryController.getAssignmentById
);

// POST /api/delivery/assignments - Create assignment (admin/manager)
router.post(
  '/assignments',
  authenticate,
  authorize(...adminRoles),
  validate(createAssignmentSchema),
  deliveryController.createAssignment
);

// PATCH /api/delivery/assignments/:id/status - Update assignment status (admin/manager/delivery)
router.patch(
  '/assignments/:id/status',
  authenticate,
  authorize(...deliveryRoles),
  validate(updateAssignmentStatusSchema),
  deliveryController.updateAssignmentStatus
);

export default router;
