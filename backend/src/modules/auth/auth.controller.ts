import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated } from '../../common/utils';
import { AuthRequest } from '../../common/types';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.register(req.body);
  sendCreated(res, { user, tokens }, 'Registration successful');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.login(req.body);
  sendSuccess(res, { user, tokens }, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.refreshToken(req.body.refreshToken);
  sendSuccess(res, { tokens }, 'Token refreshed successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await authService.logout(user!.id);
  sendSuccess(res, null, 'Logged out successfully');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const profile = await authService.getProfile(user!.id);
  sendSuccess(res, { user: profile }, 'Profile retrieved');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const updated = await authService.updateProfile(user!.id, req.body);
  sendSuccess(res, { user: updated }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await authService.changePassword(user!.id, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, null, 'Password changed successfully');
});
