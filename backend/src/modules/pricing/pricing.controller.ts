import { Request, Response } from 'express';
import { pricingService } from './pricing.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../common/utils';
import { AuthRequest } from '../../common/types';

// Helper to get param as string
const getParam = (req: Request, key: string): string => req.params[key] as string;

// ==================== PRICE RULE CRUD ====================

export const createPriceRule = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const rule = await pricingService.create(req.body, user?.id);
  sendCreated(res, { rule }, 'Price rule created successfully');
});

export const getPriceRules = asyncHandler(async (req: Request, res: Response) => {
  const result = await pricingService.getAll(req.query as any);
  sendPaginated(res, result, 'Price rules retrieved');
});

export const getPriceRuleById = asyncHandler(async (req: Request, res: Response) => {
  const rule = await pricingService.getById(getParam(req, 'id'));
  sendSuccess(res, { rule }, 'Price rule retrieved');
});

export const updatePriceRule = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const rule = await pricingService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { rule }, 'Price rule updated');
});

export const deletePriceRule = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await pricingService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});

// ==================== PRICE RESOLUTION ====================

export const resolvePrice = asyncHandler(async (req: Request, res: Response) => {
  const { productId, customerId, quantity } = req.query as {
    productId: string;
    customerId?: string;
    quantity?: string;
  };

  const resolved = await pricingService.getProductPrice(
    productId,
    customerId,
    quantity ? parseInt(quantity, 10) : undefined
  );

  sendSuccess(res, { resolved }, 'Price resolved');
});

export const resolveBulkPrices = asyncHandler(async (req: Request, res: Response) => {
  const { productIds, customerId, quantity } = req.body;

  const results = await pricingService.getBulkPrices(productIds, customerId, quantity);

  // Convert Map to plain object for JSON serialization
  const prices: Record<string, any> = {};
  results.forEach((value, key) => {
    prices[key] = value;
  });

  sendSuccess(res, { prices }, 'Bulk prices resolved');
});
