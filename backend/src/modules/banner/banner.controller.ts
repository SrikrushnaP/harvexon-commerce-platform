import { Request, Response } from 'express';
import { Banner } from './banner.model';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendNoContent } from '../../common/utils';
import { AuthRequest } from '../../common/types';

export const getActiveBanners = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();

  const banners = await Banner.find({
    isActive: true,
    $or: [
      { startDate: { $exists: false }, endDate: { $exists: false } },
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
    ],
  }).sort({ sortOrder: 1 });

  sendSuccess(res, { banners }, 'Active banners retrieved');
});

export const getAllBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await Banner.find({ isActive: { $in: [true, false] } }).sort({ sortOrder: 1 });

  sendSuccess(res, { banners }, 'All banners retrieved');
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const banner = await Banner.create({ ...req.body, createdBy: user?.id });

  sendCreated(res, { banner }, 'Banner created successfully');
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const banner = await Banner.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: user?.id },
    { new: true, runValidators: true }
  );

  if (!banner) {
    return sendSuccess(res, null, 'Banner not found');
  }

  sendSuccess(res, { banner }, 'Banner updated successfully');
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);

  if (!banner) {
    return sendSuccess(res, null, 'Banner not found');
  }

  sendNoContent(res);
});
