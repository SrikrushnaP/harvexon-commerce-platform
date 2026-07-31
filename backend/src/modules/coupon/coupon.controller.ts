import { Request, Response } from 'express';
import { couponService } from './coupon.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils';
import { AuthRequest } from '../../common/types';

// Helper to get param as string
const getParam = (req: Request, key: string): string => req.params[key] as string;

// ==================== ADMIN CRUD ====================

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const coupon = await couponService.create(req.body, user?.id);
  sendCreated(res, { coupon }, 'Coupon created successfully');
});

export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
  const result = await couponService.getAll(req.query as any);
  sendPaginated(res, result, 'Coupons retrieved');
});

export const getCouponById = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.getById(getParam(req, 'id'));
  sendSuccess(res, { coupon }, 'Coupon retrieved');
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const coupon = await couponService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { coupon }, 'Coupon updated');
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await couponService.delete(getParam(req, 'id'), user?.id);
  sendSuccess(res, null, 'Coupon deleted');
});

// ==================== CUSTOMER ENDPOINTS ====================

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const { code, cartItems, cartSubtotal } = req.body;

  const { coupon } = await couponService.validateCoupon(
    code,
    user!.id,
    cartItems,
    cartSubtotal
  );

  const discount = couponService.calculateDiscount(coupon, cartItems, cartSubtotal, 0);

  sendSuccess(res, {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      type: coupon.type,
      discountPercent: coupon.discountPercent,
      flatAmount: coupon.flatAmount,
      discount,
    },
  }, 'Coupon is valid');
});

export const getAvailableCoupons = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const cartSubtotal = parseFloat(req.query.cartSubtotal as string) || 0;

  const coupons = await couponService.getAvailableCoupons(user!.id, cartSubtotal);

  sendSuccess(res, { coupons }, 'Available coupons retrieved');
});
