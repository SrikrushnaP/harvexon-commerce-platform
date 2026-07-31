import { z } from 'zod';
import { APP_CONSTANTS } from '../../config';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createPriceRuleSchema = z.object({
  body: z.object({
    product: mongoId,
    type: z.enum(
      Object.values(APP_CONSTANTS.PRICING_TYPE) as [string, ...string[]],
      { required_error: 'Pricing type is required' }
    ),
    group: mongoId.optional(),
    customer: mongoId.optional(),
    price: z.number({ required_error: 'Price is required' }).min(0, 'Price cannot be negative'),
    minQuantity: z.number().int().min(1).optional(),
    maxQuantity: z.number().int().min(1).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    priority: z.number().int().optional(),
    notes: z.string().max(1000).optional(),
  }),
});

export const updatePriceRuleSchema = z.object({
  body: z.object({
    group: mongoId.optional(),
    customer: mongoId.optional(),
    price: z.number().min(0, 'Price cannot be negative').optional(),
    minQuantity: z.number().int().min(1).optional(),
    maxQuantity: z.number().int().min(1).optional().nullable(),
    discountPercent: z.number().min(0).max(100).optional().nullable(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    priority: z.number().int().optional(),
    notes: z.string().max(1000).optional().nullable(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Rule ID is required' }),
  }),
});

export const resolvePriceSchema = z.object({
  query: z.object({
    productId: mongoId,
    customerId: mongoId.optional(),
    quantity: z.coerce.number().int().min(1).optional(),
  }),
});

export const resolveBulkPriceSchema = z.object({
  body: z.object({
    productIds: z.array(mongoId).min(1, 'At least one product ID is required').max(100),
    customerId: mongoId.optional(),
    quantity: z.number().int().min(1).optional(),
  }),
});
