import { z } from 'zod';
import { APP_CONSTANTS } from '../../config';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// ===== Delivery Staff Validators =====

export const createStaffSchema = z.object({
  body: z.object({
    user: mongoId.optional(),
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters'),
    phone: z
      .string({ required_error: 'Phone is required' })
      .min(1, 'Phone is required'),
    email: z.string().email('Invalid email format').optional(),
    vehicleType: z.string().max(50).optional(),
    vehicleNumber: z.string().max(50).optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateStaffSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
  body: z.object({
    user: mongoId.optional(),
    name: z.string().min(1).max(100).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email('Invalid email format').optional(),
    vehicleType: z.string().max(50).optional(),
    vehicleNumber: z.string().max(50).optional(),
    isAvailable: z.boolean().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateLocationSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
  body: z.object({
    lat: z.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    lng: z.number({ required_error: 'Longitude is required' }).min(-180).max(180),
  }),
});

export const getStaffSchema = z.object({
  query: z.object({
    isAvailable: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const staffIdParamSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});

// ===== Delivery Assignment Validators =====

export const createAssignmentSchema = z.object({
  body: z.object({
    order: mongoId,
    deliveryStaff: mongoId,
    notes: z.string().max(500).optional(),
    distance: z.number().min(0, 'Distance cannot be negative').optional(),
    estimatedTime: z.number().min(0, 'Estimated time cannot be negative').optional(),
  }),
});

export const updateAssignmentStatusSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
  body: z.object({
    status: z.enum(
      Object.values(APP_CONSTANTS.DELIVERY_STATUS) as [string, ...string[]],
      { required_error: 'Status is required' }
    ),
    failureReason: z.string().max(500).optional(),
    proofOfDelivery: z.string().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const getAssignmentsSchema = z.object({
  query: z.object({
    deliveryStaff: mongoId.optional(),
    status: z.enum(
      Object.values(APP_CONSTANTS.DELIVERY_STATUS) as [string, ...string[]]
    ).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

export const assignmentIdParamSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    orderId: mongoId,
  }),
});

export const staffAssignmentsSchema = z.object({
  params: z.object({
    staffId: mongoId,
  }),
  query: z.object({
    status: z.enum(
      Object.values(APP_CONSTANTS.DELIVERY_STATUS) as [string, ...string[]]
    ).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});
