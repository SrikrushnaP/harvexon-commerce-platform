import { z } from 'zod';

export const createSettingsSchema = z.object({
  body: z.object({
    businessName: z
      .string({ required_error: 'Business name is required' })
      .min(2, 'Business name must be at least 2 characters')
      .max(200, 'Business name cannot exceed 200 characters')
      .trim(),
    tagline: z.string().max(500).trim().optional(),
    
    contact: z.object({
      phone: z.string({ required_error: 'Contact phone is required' }).min(10).max(15),
      email: z.string({ required_error: 'Contact email is required' }).email(),
      address: z.string({ required_error: 'Address is required' }).min(5).max(500),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      pincode: z.string().max(10).optional(),
      country: z.string().max(100).optional(),
    }),

    currency: z.string().max(10).optional(),
    currencySymbol: z.string().max(5).optional(),
    timezone: z.string().max(50).optional(),
    language: z.string().max(10).optional(),

    invoicePrefix: z.string().max(10).optional(),
    invoiceStartNumber: z.number().int().min(1).optional(),
    gstNumber: z.string().max(20).optional(),
    panNumber: z.string().max(15).optional(),

    theme: z.object({
      primaryColor: z.string().max(20).optional(),
      accentColor: z.string().max(20).optional(),
      headerBg: z.string().max(20).optional(),
      footerText: z.string().max(500).optional(),
    }).optional(),

    businessHours: z.object({
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
      workingDays: z.array(z.string()).optional(),
    }).optional(),

    orderSettings: z.object({
      minOrderAmount: z.number().min(0).optional(),
      deliveryCharge: z.number().min(0).optional(),
      freeDeliveryAbove: z.number().min(0).optional(),
      acceptOrders: z.boolean().optional(),
      orderCutoffTime: z.string().optional(),
      deliveryMessage: z.string().max(200).trim().optional(),
      serviceablePincodes: z.array(z.string().trim().min(4).max(10)).optional(),
    }).optional(),

    notifications: z.object({
      smsEnabled: z.boolean().optional(),
      whatsappEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
    }).optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).max(200).trim().optional(),
    tagline: z.string().max(500).trim().optional(),
    
    contact: z.object({
      phone: z.string().min(10).max(15).optional(),
      email: z.string().email().optional(),
      address: z.string().min(5).max(500).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      pincode: z.string().max(10).optional(),
      country: z.string().max(100).optional(),
    }).optional(),

    currency: z.string().max(10).optional(),
    currencySymbol: z.string().max(5).optional(),
    timezone: z.string().max(50).optional(),
    language: z.string().max(10).optional(),

    invoicePrefix: z.string().max(10).optional(),
    invoiceStartNumber: z.number().int().min(1).optional(),
    gstNumber: z.string().max(20).optional(),
    panNumber: z.string().max(15).optional(),

    theme: z.object({
      primaryColor: z.string().max(20).optional(),
      accentColor: z.string().max(20).optional(),
      headerBg: z.string().max(20).optional(),
      footerText: z.string().max(500).optional(),
    }).optional(),

    businessHours: z.object({
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
      workingDays: z.array(z.string()).optional(),
    }).optional(),

    orderSettings: z.object({
      minOrderAmount: z.number().min(0).optional(),
      deliveryCharge: z.number().min(0).optional(),
      freeDeliveryAbove: z.number().min(0).optional(),
      acceptOrders: z.boolean().optional(),
      orderCutoffTime: z.string().optional(),
      deliveryMessage: z.string().max(200).trim().optional(),
      serviceablePincodes: z.array(z.string().trim().min(4).max(10)).optional(),
    }).optional(),

    notifications: z.object({
      smsEnabled: z.boolean().optional(),
      whatsappEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
    }).optional(),
  }),
});
