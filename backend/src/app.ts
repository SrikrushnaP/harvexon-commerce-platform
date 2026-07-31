import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './common/middleware';
import { authRoutes } from './modules/auth';
import { settingsRoutes } from './modules/settings';
import { catalogRoutes } from './modules/catalog';
import { customerRoutes } from './modules/customer';
import { pricingRoutes } from './modules/pricing';
import { orderRoutes } from './modules/order';
import { inventoryRoutes } from './modules/inventory';
import { purchasingRoutes } from './modules/purchasing';
import { deliveryRoutes } from './modules/delivery';
import { uploadRoutes } from './modules/upload';
import { invoiceRoutes } from './modules/invoice';
import { analyticsRoutes } from './modules/analytics';

const app: Application = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// NoSQL injection sanitization
app.use(mongoSanitize());

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

// Logging
if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Static files (uploads)
app.use('/uploads', express.static(config.upload.dir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'HCP API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchasing', purchasingRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

export default app;
