import { Request, Response } from 'express';
import { settingsService } from './settings.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated } from '../../common/utils';
import { AuthRequest } from '../../common/types';

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  sendSuccess(res, { settings }, settings ? 'Settings retrieved' : 'No settings configured yet');
});

export const getPublicSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await settingsService.getPublicSettings();
  sendSuccess(res, { settings }, 'Public settings retrieved');
});

export const createSettings = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const settings = await settingsService.createSettings(req.body, user?.id);
  sendCreated(res, { settings }, 'Settings created successfully');
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const settings = await settingsService.updateSettings(req.body, user?.id);
  sendSuccess(res, { settings }, 'Settings updated successfully');
});
