import { z } from 'zod';
import { APP_CONSTANTS } from '../../config';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// --- Customer Group Validators ---

export const createCustomerGroupSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2).max(100).trim(),
    type: z.enum(
      Object.values(APP_CONSTANTS.CUSTOMER_GROUP_TYPE) as [string, ...string[]],
      { required_error: 'Type is required' }
    ),
    description: z.string().max(500).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    minOrderAmount: z.number().min(0).optional(),
    creditLimit: z.number().min(0).optional(),
    creditPeriodDays: z.number().int().min(0).optional(),
    paymentTerms: z.string().max(500).optional(),
  }),
});

export const updateCustomerGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    type: z.enum(
      Object.values(APP_CONSTANTS.CUSTOMER_GROUP_TYPE) as [string, ...string[]]
    ).optional(),
    description: z.string().max(500).optional().nullable(),
    discountPercent: z.number().min(0).max(100).optional(),
    minOrderAmount: z.number().min(0).optional(),
    creditLimit: z.number().min(0).optional(),
    creditPeriodDays: z.number().int().min(0).optional(),
    paymentTerms: z.string().max(500).optional().nullable(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Group ID is required' }),
  }),
});

// --- Customer Validators ---

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2).max(200).trim(),
    phone: z.string({ required_error: 'Phone is required' }).min(10).max(15).trim(),
    email: z.string().email().optional(),
    group: mongoId,
    gstin: z.string().max(20).optional(),
    businessName: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).trim().optional(),
    phone: z.string().min(10).max(15).trim().optional(),
    email: z.string().email().optional().nullable(),
    group: mongoId.optional(),
    gstin: z.string().max(20).optional().nullable(),
    businessName: z.string().max(200).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Customer ID is required' }),
  }),
});

// --- Address Validators ---

export const createAddressSchema = z.object({
  body: z.object({
    customer: mongoId,
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
    isDefault: z.boolean().optional(),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    label: z.string().max(50).optional().nullable(),
    line1: z.string().min(1).max(200).trim().optional(),
    line2: z.string().max(200).optional().nullable(),
    city: z.string().min(1).max(100).trim().optional(),
    state: z.string().min(1).max(100).trim().optional(),
    pincode: z.string().min(4).max(10).trim().optional(),
    landmark: z.string().max(200).optional().nullable(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional().nullable(),
    isDefault: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Address ID is required' }),
  }),
});
