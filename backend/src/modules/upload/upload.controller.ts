import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess } from '../../common/utils';
import { NotFoundError, ValidationError } from '../../common/middleware';

export const uploadSingleImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No image file provided');
  }

  const url = `/uploads/${req.file.filename}`;
  sendSuccess(res, { url }, 'Image uploaded successfully');
});

export const uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new ValidationError('No image files provided');
  }

  const urls = (req.files as Express.Multer.File[]).map(
    (file) => `/uploads/${file.filename}`
  );

  sendSuccess(res, { urls }, 'Images uploaded successfully');
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.body;

  if (!filename) {
    throw new ValidationError('Filename is required');
  }

  // Prevent directory traversal
  const sanitized = path.basename(filename);
  const filePath = path.join(config.upload.dir, sanitized);

  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('Image not found');
  }

  fs.unlinkSync(filePath);
  sendSuccess(res, null, 'Image deleted successfully');
});
