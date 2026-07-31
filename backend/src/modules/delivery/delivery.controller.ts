import { Request, Response } from 'express';
import { deliveryStaffService, deliveryAssignmentService } from './delivery.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../common/utils';
import { AuthRequest } from '../../common/types';
import { DeliveryStatus } from '../../config';

const getParam = (req: Request, key: string): string => req.params[key] as string;

// ===== Delivery Staff Controllers =====

export const createDeliveryStaff = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const staff = await deliveryStaffService.create(req.body, user?.id);
  sendCreated(res, { staff }, 'Delivery staff created');
});

export const getDeliveryStaff = asyncHandler(async (req: Request, res: Response) => {
  const result = await deliveryStaffService.getAll(req.query as any);
  sendPaginated(res, result, 'Delivery staff retrieved');
});

export const getDeliveryStaffById = asyncHandler(async (req: Request, res: Response) => {
  const staff = await deliveryStaffService.getById(getParam(req, 'id'));
  sendSuccess(res, { staff }, 'Delivery staff retrieved');
});

export const updateDeliveryStaff = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const staff = await deliveryStaffService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { staff }, 'Delivery staff updated');
});

export const deleteDeliveryStaff = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await deliveryStaffService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const staff = await deliveryStaffService.toggleAvailability(getParam(req, 'id'), user?.id);
  sendSuccess(res, { staff }, `Delivery staff marked as ${staff.isAvailable ? 'available' : 'unavailable'}`);
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  const staff = await deliveryStaffService.updateLocation(getParam(req, 'id'), lat, lng);
  sendSuccess(res, { staff }, 'Location updated');
});

// ===== Delivery Assignment Controllers =====

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const assignment = await deliveryAssignmentService.create(req.body, user?.id);
  sendCreated(res, { assignment }, 'Delivery assignment created');
});

export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const result = await deliveryAssignmentService.getAll(req.query as any);
  sendPaginated(res, result, 'Assignments retrieved');
});

export const getAssignmentById = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await deliveryAssignmentService.getById(getParam(req, 'id'));
  sendSuccess(res, { assignment }, 'Assignment retrieved');
});

export const getAssignmentByOrder = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await deliveryAssignmentService.getByOrder(getParam(req, 'orderId'));
  sendSuccess(res, { assignment }, 'Assignment retrieved');
});

export const updateAssignmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const { status, ...data } = req.body;
  const assignment = await deliveryAssignmentService.updateStatus(
    getParam(req, 'id'),
    status as DeliveryStatus,
    user?.id,
    data
  );
  sendSuccess(res, { assignment }, `Assignment status updated to '${status}'`);
});

export const getStaffAssignments = asyncHandler(async (req: Request, res: Response) => {
  const result = await deliveryAssignmentService.getStaffAssignments(
    getParam(req, 'staffId'),
    req.query as any
  );
  sendPaginated(res, result, 'Staff assignments retrieved');
});
