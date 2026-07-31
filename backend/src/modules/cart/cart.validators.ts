import { z } from 'zod';

export const addItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().min(1).default(1),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({
    itemId: z.string().min(1),
  }),
  body: z.object({
    quantity: z.number().int().min(0),
  }),
});

export const removeItemSchema = z.object({
  params: z.object({
    itemId: z.string().min(1),
  }),
});

export const syncCartSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
    })),
  }),
});
