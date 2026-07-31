import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils';
import { AuthRequest } from '../../common/types';

const getParam = (req: Request, key: string): string => req.params[key] as string;

export const addTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const transaction = await inventoryService.addTransaction(req.body, user?.id);
  sendCreated(res, { transaction }, 'Inventory transaction recorded');
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryService.getTransactions(req.query as any);
  sendPaginated(res, result, 'Transactions retrieved');
});

export const getProductStock = asyncHandler(async (req: Request, res: Response) => {
  const stock = await inventoryService.getProductStock(getParam(req, 'productId'));
  sendSuccess(res, { stock }, 'Stock retrieved');
});

export const getBulkStock = asyncHandler(async (req: Request, res: Response) => {
  const stocks = await inventoryService.getBulkStock(req.body.productIds);
  sendSuccess(res, { stocks }, 'Bulk stock retrieved');
});

export const getStockReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await inventoryService.getStockReport(req.query as any);
  sendPaginated(res, result, 'Stock report retrieved');
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const { product, quantity, direction, notes } = req.body;
  const transaction = await inventoryService.adjustStock(
    product,
    quantity,
    direction,
    notes,
    user?.id
  );
  sendCreated(res, { transaction }, 'Stock adjustment recorded');
});
