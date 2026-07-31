import { Request, Response } from 'express';
import { supplierService, purchaseService } from './purchasing.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../common/utils';
import { AuthRequest } from '../../common/types';

const getParam = (req: Request, key: string): string => req.params[key] as string;

// =====================
// Supplier Controllers
// =====================

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const supplier = await supplierService.create(req.body, user?.id);
  sendCreated(res, { supplier }, 'Supplier created successfully');
});

export const getSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const result = await supplierService.getAll(req.query as any);
  sendPaginated(res, result, 'Suppliers retrieved');
});

export const getSupplierById = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await supplierService.getById(getParam(req, 'id'));
  sendSuccess(res, { supplier }, 'Supplier retrieved');
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const supplier = await supplierService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { supplier }, 'Supplier updated successfully');
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await supplierService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});

// =====================
// Purchase Controllers
// =====================

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const purchase = await purchaseService.create(req.body, user?.id);
  sendCreated(res, { purchase }, 'Purchase order created successfully');
});

export const getPurchases = asyncHandler(async (req: Request, res: Response) => {
  const result = await purchaseService.getAll(req.query as any);
  sendPaginated(res, result, 'Purchases retrieved');
});

export const getPurchaseById = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await purchaseService.getById(getParam(req, 'id'));
  sendSuccess(res, { purchase }, 'Purchase retrieved');
});

export const updatePurchaseStatus = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const purchase = await purchaseService.updateStatus(
    getParam(req, 'id'),
    req.body.status,
    user?.id
  );
  sendSuccess(res, { purchase }, 'Purchase status updated successfully');
});

export const updatePurchaseItems = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const purchase = await purchaseService.updateItems(
    getParam(req, 'id'),
    req.body.items,
    user?.id
  );
  sendSuccess(res, { purchase }, 'Purchase items updated successfully');
});

export const cancelPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const purchase = await purchaseService.cancelPurchase(getParam(req, 'id'), user?.id);
  sendSuccess(res, { purchase }, 'Purchase cancelled successfully');
});
