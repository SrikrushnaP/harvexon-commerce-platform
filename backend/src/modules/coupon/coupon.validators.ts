import { z } from 'zod';
import { APP_CONSTANTS } from '../../config';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const couponTypes = Object.values(APP_CONSTANTS.COUPON_TYPE) as [string, ...string[]];

const productConditionSchema = z.object({
  product: mongoId,
  specialPrice: z.number().min(0, 'Special price cannot be negative'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const buyXGetYSchema = z.object({
  product: mongoId,
  buyQty: z.number().int().min(1, 'Buy quantity must be at least 1'),
  getQty: z.number().int().min(1, 'Get quantity must be at least 1'),
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string({ required_error: 'Coupon code is required' })
      .min(1, 'Coupon code is required')
      .max(50, 'Coupon code cannot exceed 50 characters')
      .transform((val) => val.toUpperCase().trim()),
    title: z.string({ required_error: 'Title is required' })
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters'),
    description: z.string().max(1000).optional(),
    type: z.enum(couponTypes, { required_error: 'Coupon type is required' }),
    discountPercent: z.number().min(0).max(100).optional(),
    maxDiscount: z.number().min(0).optional(),
    flatAmount: z.number().min(0).optional(),
    minCartValue: z.number().min(0).default(0),
    productCondition: productConditionSchema.optional(),
    buyXGetY: buyXGetYSchema.optional(),
    applicableCategories: z.array(mongoId).optional(),
    applicableProducts: z.array(mongoId).optional(),
    excludedProducts: z.array(mongoId).optional(),
    customerGroups: z.array(mongoId).optional(),
    specificCustomers: z.array(mongoId).optional(),
    maxTotalUses: z.number().int().min(0).optional(),
    maxUsesPerCustomer: z.number().int().min(0).default(1),
    startDate: z.string({ required_error: 'Start date is required' })
      .refine(val => !isNaN(Date.parse(val)), 'Invalid date format'),
    endDate: z.string({ required_error: 'End date is required' })
      .refine(val => !isNaN(Date.parse(val)), 'Invalid date format'),
    isCombinable: z.boolean().default(false),
    autoApply: z.boolean().default(false),
  }),
});

export const updateCouponSchema = z.object({
  body: z.object({
    code: z.string()
      .min(1)
      .max(50)
      .transform((val) => val.toUpperCase().trim())
      .optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    type: z.enum(couponTypes).optional(),
    discountPercent: z.number().min(0).max(100).optional().nullable(),
    maxDiscount: z.number().min(0).optional().nullable(),
    flatAmount: z.number().min(0).optional().nullable(),
    minCartValue: z.number().min(0).optional(),
    productCondition: productConditionSchema.optional().nullable(),
    buyXGetY: buyXGetYSchema.optional().nullable(),
    applicableCategories: z.array(mongoId).optional(),
    applicableProducts: z.array(mongoId).optional(),
    excludedProducts: z.array(mongoId).optional(),
    customerGroups: z.array(mongoId).optional(),
    specificCustomers: z.array(mongoId).optional(),
    maxTotalUses: z.number().int().min(0).optional().nullable(),
    maxUsesPerCustomer: z.number().int().min(0).optional(),
    startDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
    endDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
    isCombinable: z.boolean().optional(),
    autoApply: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: mongoId,
  }),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string({ required_error: 'Coupon code is required' })
      .min(1, 'Coupon code is required')
      .transform((val) => val.toUpperCase().trim()),
    cartItems: z.array(z.object({
      product: z.string(),
      quantity: z.number().int().min(1),
      price: z.number().min(0).optional().default(0),
      total: z.number().min(0).optional().default(0),
      category: z.string().optional(),
    })).min(1, 'At least one cart item is required'),
    cartSubtotal: z.number({ required_error: 'Cart subtotal is required' }).min(0),
  }),
});

export const getCouponsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    type: z.enum(couponTypes).optional(),
    isActive: z.coerce.boolean().optional(),
    autoApply: z.coerce.boolean().optional(),
  }),
});

export const couponIdParamSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});
