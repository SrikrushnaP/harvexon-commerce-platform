import { z } from 'zod';
import { APP_CONSTANTS } from '../../config';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    phone: z
      .string({ required_error: 'Phone is required' })
      .min(10, 'Phone must be at least 10 digits')
      .max(15, 'Phone cannot exceed 15 digits')
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(128, 'Password cannot exceed 128 characters'),
    role: z
      .enum(Object.values(APP_CONSTANTS.ROLES) as [string, ...string[]])
      .optional()
      .default(APP_CONSTANTS.ROLES.CUSTOMER),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'New password must be at least 6 characters')
      .max(128, 'New password cannot exceed 128 characters'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    phone: z
      .string()
      .min(10, 'Phone must be at least 10 digits')
      .max(15, 'Phone cannot exceed 15 digits')
      .trim()
      .optional(),
    notificationPreferences: z.object({
      orderUpdates: z.boolean().optional(),
      promotions: z.boolean().optional(),
      deliveryAlerts: z.boolean().optional(),
    }).optional(),
  }),
});
