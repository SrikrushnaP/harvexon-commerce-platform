import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { config } from '../../config';
import { APP_CONSTANTS } from '../../config';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess } from '../../common/utils';
import { NotFoundError, ValidationError } from '../../common/middleware';

const UPLOAD_DIR = config.upload.dir;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const THUMBNAIL_WIDTH = 300;
const QUALITY = 80;

// Ensure upload directories exist
const thumbDir = path.join(UPLOAD_DIR, 'thumbs');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

async function processAndSave(file: Express.Multer.File): Promise<{ url: string; thumbnail: string }> {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${uniqueSuffix}.webp`;
  const thumbFilename = `thumb_${filename}`;

  const outputPath = path.join(UPLOAD_DIR, filename);
  const thumbPath = path.join(thumbDir, thumbFilename);

  // Validate image dimensions and format using sharp metadata
  const metadata = await sharp(file.buffer).metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new ValidationError('Invalid image file — could not read dimensions');
  }

  // Resize to max dimensions, convert to webp for optimization
  await sharp(file.buffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toFile(outputPath);

  // Generate thumbnail
  await sharp(file.buffer)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_WIDTH, {
      fit: 'cover',
    })
    .webp({ quality: 70 })
    .toFile(thumbPath);

  return {
    url: `/uploads/${filename}`,
    thumbnail: `/uploads/thumbs/${thumbFilename}`,
  };
}

export const uploadSingleImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No image file provided');
  }

  const result = await processAndSave(req.file);
  sendSuccess(res, result, 'Image uploaded successfully');
});

export const uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new ValidationError('No image files provided');
  }

  const results = await Promise.all(
    (req.files as Express.Multer.File[]).map(processAndSave)
  );

  sendSuccess(res, { images: results }, 'Images uploaded successfully');
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { filename } = req.body;

  if (!filename) {
    throw new ValidationError('Filename is required');
  }

  // Prevent directory traversal
  const sanitized = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, sanitized);
  const thumbPath = path.join(thumbDir, `thumb_${sanitized}`);

  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('Image not found');
  }

  fs.unlinkSync(filePath);
  // Also delete thumbnail if exists
  if (fs.existsSync(thumbPath)) {
    fs.unlinkSync(thumbPath);
  }

  sendSuccess(res, null, 'Image deleted successfully');
});
