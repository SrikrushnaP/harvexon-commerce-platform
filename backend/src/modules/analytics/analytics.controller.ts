import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess } from '../../common/utils';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getDashboard();
  sendSuccess(res, data, 'Dashboard analytics retrieved');
});
