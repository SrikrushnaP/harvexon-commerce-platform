import { z } from 'zod';

export const myCreateAddressSchema = z.object({
  body: z.object({
    label: z.string().max(50).optional(),
    line1: z.string({ required_error: 'Address line 1 is required' }).min(1).max(200).trim(),
    line2: z.string().max(200).optional(),
    city: z.string({ required_error: 'City is required' }).min(1).max(100).trim(),
    state: z.string({ required_error: 'State is required' }).min(1).max(100).trim(),
    pincode: z.string({ required_error: 'Pincode is required' }).min(4).max(10).trim(),
    landmark: z.string().max(200).optional(),
    phone: z.string().max(15).optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const myUpdateAddressSchema = z.object({
  body: z.object({
    label: z.string().max(50).optional().nullable(),
    line1: z.string().min(1).max(200).trim().optional(),
    line2: z.string().max(200).optional().nullable(),
    city: z.string().min(1).max(100).trim().optional(),
    state: z.string().min(1).max(100).trim().optional(),
    pincode: z.string().min(4).max(10).trim().optional(),
    landmark: z.string().max(200).optional().nullable(),
    phone: z.string().max(15).optional().nullable(),
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
