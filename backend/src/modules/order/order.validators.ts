import { z } from 'zod';
import { APP_CONSTANTS } from '../../config';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const deliveryAddressObject = z.object({
  label: z.string().max(50).optional(),
  line1: z.string({ required_error: 'Address line 1 is required' }).min(1).max(200).trim(),
  line2: z.string().max(200).optional(),
  city: z.string({ required_error: 'City is required' }).min(1).max(100).trim(),
  state: z.string({ required_error: 'State is required' }).min(1).max(100).trim(),
  pincode: z.string({ required_error: 'Pincode is required' }).min(4).max(10).trim(),
  landmark: z.string().max(200).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const orderItemInput = z.object({
  product: mongoId,
  quantity: z.number({ required_error: 'Quantity is required' }).int().min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  body: z.object({
    customer: mongoId.optional(),
    deliveryAddress: z.union([deliveryAddressObject, z.object({ addressId: mongoId })]),
    items: z.array(orderItemInput).min(1, 'At least one item is required'),
    paymentMethod: z.enum(['cash', 'cod', 'upi', 'bank_transfer', 'credit'], {
      required_error: 'Payment method is required',
    }),
    notes: z.string().max(1000).optional(),
    discount: z.number().min(0).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(
      Object.values(APP_CONSTANTS.ORDER_STATUS) as [string, ...string[]],
      { required_error: 'Status is required' }
    ),
    notes: z.string().max(500).optional(),
    deliveryStaff: mongoId.optional(),
  }),
  params: z.object({
    id: mongoId,
  }),
});

export const updateItemsSchema = z.object({
  body: z.object({
    items: z.array(orderItemInput).min(1, 'At least one item is required'),
  }),
  params: z.object({
    id: mongoId,
  }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string({ required_error: 'Cancellation reason is required' }).min(1).max(500),
  }),
  params: z.object({
    id: mongoId,
  }),
});
