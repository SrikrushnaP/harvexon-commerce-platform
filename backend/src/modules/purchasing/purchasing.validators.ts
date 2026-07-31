import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Supplier validators

export const createSupplierSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Supplier name is required' })
      .min(1, 'Supplier name is required')
      .max(200),
    contactPerson: z.string().max(100).optional(),
    phone: z
      .string({ required_error: 'Phone is required' })
      .min(1, 'Phone is required'),
    email: z.string().email('Invalid email format').optional(),
    address: z
      .object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
      })
      .optional(),
    gstin: z.string().optional(),
    paymentTerms: z.string().optional(),
    bankDetails: z
      .object({
        accountName: z.string().optional(),
        accountNumber: z.string().optional(),
        bankName: z.string().optional(),
        ifsc: z.string().optional(),
      })
      .optional(),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    contactPerson: z.string().max(100).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email('Invalid email format').optional(),
    address: z
      .object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
      })
      .optional(),
    gstin: z.string().optional(),
    paymentTerms: z.string().optional(),
    bankDetails: z
      .object({
        accountName: z.string().optional(),
        accountNumber: z.string().optional(),
        bankName: z.string().optional(),
        ifsc: z.string().optional(),
      })
      .optional(),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const getSupplierByIdSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});

export const getSuppliersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

// Purchase validators

const purchaseItemInput = z.object({
  product: mongoId,
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int()
    .min(1, 'Quantity must be at least 1'),
  unitCost: z
    .number({ required_error: 'Unit cost is required' })
    .min(0, 'Unit cost cannot be negative'),
  batchNumber: z.string().max(100).optional(),
  expiryDate: z.string().datetime().optional(),
});

export const createPurchaseSchema = z.object({
  body: z.object({
    supplier: mongoId,
    items: z
      .array(purchaseItemInput)
      .min(1, 'At least one item is required'),
    tax: z.number().min(0).optional(),
    shippingCost: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    notes: z.string().max(1000).optional(),
    expectedDeliveryDate: z.string().datetime().optional(),
  }),
});

export const updatePurchaseStatusSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
  body: z.object({
    status: z.enum(['draft', 'ordered', 'partial', 'received', 'cancelled'], {
      required_error: 'Status is required',
    }),
  }),
});

export const updatePurchaseItemsSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
  body: z.object({
    items: z
      .array(purchaseItemInput)
      .min(1, 'At least one item is required'),
  }),
});

export const getPurchaseByIdSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});

export const getPurchasesSchema = z.object({
  query: z.object({
    supplier: mongoId.optional(),
    status: z.enum(['draft', 'ordered', 'partial', 'received', 'cancelled']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const cancelPurchaseSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});
