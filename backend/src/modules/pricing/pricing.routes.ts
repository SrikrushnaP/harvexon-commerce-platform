import { Router, IRouter } from 'express';
import * as pricingController from './pricing.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import {
  createPriceRuleSchema,
  updatePriceRuleSchema,
  resolvePriceSchema,
  resolveBulkPriceSchema,
} from './pricing.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

// ==================== PRICE RESOLUTION (Public) ====================

router.get('/resolve', validate(resolvePriceSchema), pricingController.resolvePrice);
router.post('/resolve/bulk', validate(resolveBulkPriceSchema), pricingController.resolveBulkPrices);

// ==================== PRICE RULE CRUD (Admin) ====================

router.get('/rules', authenticate, authorize(...adminRoles), pricingController.getPriceRules);
router.get('/rules/:id', authenticate, authorize(...adminRoles), pricingController.getPriceRuleById);
router.post('/rules', authenticate, authorize(...adminRoles), validate(createPriceRuleSchema), pricingController.createPriceRule);
router.patch('/rules/:id', authenticate, authorize(...adminRoles), validate(updatePriceRuleSchema), pricingController.updatePriceRule);
router.delete('/rules/:id', authenticate, authorize(...adminRoles), pricingController.deletePriceRule);

export default router;
