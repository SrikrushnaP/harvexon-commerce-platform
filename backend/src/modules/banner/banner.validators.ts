import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const bannerTypes = ['offer', 'announcement', 'promo'] as const;

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' })
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters'),
    subtitle: z.string().max(500).optional(),
    image: z.string().url('Image must be a valid URL').optional(),
    link: z.string().max(500).optional(),
    type: z.enum(bannerTypes).default('offer'),
    bgColor: z.string().max(50).default('#f0fdf4'),
    textColor: z.string().max(50).default('#065f46'),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
    startDate: z.string()
      .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
      .optional(),
    endDate: z.string()
      .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
      .optional(),
  }),
});

export const updateBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(500).optional().nullable(),
    image: z.string().url('Image must be a valid URL').optional().nullable(),
    link: z.string().max(500).optional().nullable(),
    type: z.enum(bannerTypes).optional(),
    bgColor: z.string().max(50).optional(),
    textColor: z.string().max(50).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    startDate: z.string()
      .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
      .optional()
      .nullable(),
    endDate: z.string()
      .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
      .optional()
      .nullable(),
  }),
  params: z.object({
    id: mongoId,
  }),
});
