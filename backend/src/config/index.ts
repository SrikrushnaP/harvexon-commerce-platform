import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates that critical environment variables are set in production.
 * In development, fallback values are used instead.
 */
function validateEnv(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'] as const;
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `[Config] Missing required environment variables in production: ${missing.join(', ')}`
      );
    }
  }
}

validateEnv();

function parseCorsOrigin(): string | string[] {
  const raw = process.env.CORS_ORIGIN;

  if (!raw) {
    return ['http://localhost:4200', 'http://localhost:4300'];
  }

  // Allow wildcard '*' for development convenience
  if (raw.trim() === '*') {
    return '*';
  }

  return raw.split(',').map((origin) => origin.trim());
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hcp_dev',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },

  cors: {
    origin: parseCorsOrigin(),
  },

  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'HrFressh <noreply@hrfressh.com>',
  },
};

export { APP_CONSTANTS } from './constants';
export type {
  Role,
  OrderStatus,
  InventoryTransactionType,
  DeliveryStatus,
  CustomerGroupType,
  PricingType,
  CouponType,
} from './constants';
