import { Router, IRouter } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { APP_CONSTANTS, config } from '../../config';
import { authenticate, authorize } from '../auth';
import * as uploadController from './upload.controller';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

// Ensure uploads directory exists
const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter for allowed image types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (APP_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.mimetype as typeof APP_CONSTANTS.ALLOWED_IMAGE_TYPES[number])) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${APP_CONSTANTS.ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB
  },
});

// POST /api/upload/image — single image upload
router.post(
  '/image',
  authenticate,
  authorize(...adminRoles),
  upload.single('image'),
  uploadController.uploadSingleImage
);

// POST /api/upload/images — multiple image upload (max 5)
router.post(
  '/images',
  authenticate,
  authorize(...adminRoles),
  upload.array('images', APP_CONSTANTS.MAX_IMAGES_PER_PRODUCT),
  uploadController.uploadMultipleImages
);

// DELETE /api/upload/image — delete an image by filename
router.delete(
  '/image',
  authenticate,
  authorize(...adminRoles),
  uploadController.deleteImage
);

export default router;
