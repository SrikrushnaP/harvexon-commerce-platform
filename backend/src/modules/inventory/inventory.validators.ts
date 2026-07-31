import { z } from 'zod';
import { APP_CONSTANTS } from '../../config';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const addTransactionSchema = z.object({
  body: z.object({
    product: mongoId,
    type: z.enum(
      Object.values(APP_CONSTANTS.INVENTORY_TRANSACTION_TYPE) as [string, ...string[]],
      { required_error: 'Transaction type is required' }
    ),
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .positive('Quantity must be positive'),
    direction: z.enum(['in', 'out'], {
      required_error: 'Direction is required',
    }),
    referenceType: z.enum(['order', 'purchase', 'manual']).optional(),
    referenceId: mongoId.optional(),
    batchNumber: z.string().max(100).optional(),
    expiryDate: z.string().datetime().optional(),
    unitCost: z.number().min(0, 'Unit cost cannot be negative').optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    product: mongoId,
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .positive('Quantity must be positive'),
    direction: z.enum(['in', 'out'], {
      required_error: 'Direction is required',
    }),
    notes: z
      .string({ required_error: 'Notes are required for adjustments' })
      .min(1, 'Notes are required for adjustments')
      .max(500),
  }),
});

export const getTransactionsSchema = z.object({
  query: z.object({
    product: mongoId.optional(),
    type: z.enum(
      Object.values(APP_CONSTANTS.INVENTORY_TRANSACTION_TYPE) as [string, ...string[]]
    ).optional(),
    direction: z.enum(['in', 'out']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const getStockSchema = z.object({
  params: z.object({
    productId: mongoId,
  }),
});

export const getBulkStockSchema = z.object({
  body: z.object({
    productIds: z.array(mongoId).min(1, 'At least one product ID is required').max(100),
  }),
});

export const getStockReportSchema = z.object({
  query: z.object({
    lowStock: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});
