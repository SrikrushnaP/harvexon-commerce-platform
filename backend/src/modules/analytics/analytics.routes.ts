import { Router, IRouter } from 'express';
import * as analyticsController from './analytics.controller';
import { authenticate, authorize } from '../auth';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

// Dashboard analytics
router.get('/dashboard', authenticate, authorize(...adminRoles), analyticsController.getDashboard);

export default router;
