import { Request, Response } from 'express';
import { customerGroupService, customerService, addressService } from './customer.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../common/utils';
import { AuthRequest } from '../../common/types';

// Helper to get param as string
const getParam = (req: Request, key: string): string => req.params[key] as string;

// ==================== CUSTOMER GROUP CONTROLLERS ====================

export const createCustomerGroup = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const group = await customerGroupService.create(req.body, user?.id);
  sendCreated(res, { group }, 'Customer group created successfully');
});

export const getCustomerGroups = asyncHandler(async (_req: Request, res: Response) => {
  const groups = await customerGroupService.getAll();
  sendSuccess(res, { groups }, 'Customer groups retrieved');
});

export const getCustomerGroupById = asyncHandler(async (req: Request, res: Response) => {
  const group = await customerGroupService.getById(getParam(req, 'id'));
  sendSuccess(res, { group }, 'Customer group retrieved');
});

export const updateCustomerGroup = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const group = await customerGroupService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { group }, 'Customer group updated');
});

export const deleteCustomerGroup = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await customerGroupService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});

// ==================== CUSTOMER CONTROLLERS ====================

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const customer = await customerService.create(req.body, user?.id);
  sendCreated(res, { customer }, 'Customer created successfully');
});

export const getCustomers = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.getAll(req.query as any);
  sendPaginated(res, result, 'Customers retrieved');
});

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getById(getParam(req, 'id'));
  sendSuccess(res, { customer }, 'Customer retrieved');
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const customer = await customerService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { customer }, 'Customer updated');
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await customerService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});

// ==================== ADDRESS CONTROLLERS ====================

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const address = await addressService.create(req.body, user?.id);
  sendCreated(res, { address }, 'Address created successfully');
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.getAll(req.query as any);
  sendSuccess(res, { addresses }, 'Addresses retrieved');
});

export const getAddressById = asyncHandler(async (req: Request, res: Response) => {
  const address = await addressService.getById(getParam(req, 'id'));
  sendSuccess(res, { address }, 'Address retrieved');
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const address = await addressService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { address }, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await addressService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});
