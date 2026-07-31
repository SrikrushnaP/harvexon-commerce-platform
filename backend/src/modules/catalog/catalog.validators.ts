import { z } from 'zod';

// --- Category Validators ---
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2).max(100).trim(),
    description: z.string().max(500).optional(),
    image: z.string().url().optional(),
    parent: z.string().optional(), // ObjectId as string
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).optional(),
    image: z.string().url().optional().nullable(),
    parent: z.string().optional().nullable(),
    sortOrder: z.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Category ID is required' }),
  }),
});

// --- Unit Validators ---
export const createUnitSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(1).max(50).trim(),
    shortName: z.string({ required_error: 'Short name is required' }).min(1).max(10).trim(),
  }),
});

export const updateUnitSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).trim().optional(),
    shortName: z.string().min(1).max(10).trim().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Unit ID is required' }),
  }),
});

// --- Brand Validators ---
export const createBrandSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2).max(100).trim(),
    description: z.string().max(500).optional(),
    logo: z.string().url().optional(),
  }),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).optional(),
    logo: z.string().url().optional().nullable(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Brand ID is required' }),
  }),
});

// --- Product Validators ---
export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2).max(200).trim(),
    sku: z.string().max(50).optional(),
    description: z.string().max(2000).optional(),
    category: z.string({ required_error: 'Category is required' }),
    brand: z.string().optional(),
    unit: z.string({ required_error: 'Unit is required' }),
    basePrice: z.number({ required_error: 'Base price is required' }).min(0),
    images: z.array(z.string()).max(5).optional(),
    attributes: z.record(z.any()).optional(),
    isFeatured: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    sortOrder: z.number().int().min(0).optional(),
    trackInventory: z.boolean().optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).trim().optional(),
    sku: z.string().max(50).optional().nullable(),
    description: z.string().max(2000).optional(),
    category: z.string().optional(),
    brand: z.string().optional().nullable(),
    unit: z.string().optional(),
    basePrice: z.number().min(0).optional(),
    images: z.array(z.string()).max(5).optional(),
    attributes: z.record(z.any()).optional(),
    isFeatured: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    sortOrder: z.number().int().min(0).optional(),
    trackInventory: z.boolean().optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Product ID is required' }),
  }),
});
