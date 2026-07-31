import { Router, IRouter } from 'express';
import * as catalogController from './catalog.controller';
import { authenticate, authorize } from '../auth';
import { validate } from '../../common/middleware';
import {
  createCategorySchema, updateCategorySchema,
  createUnitSchema, updateUnitSchema,
  createBrandSchema, updateBrandSchema,
  createProductSchema, updateProductSchema,
} from './catalog.validators';
import { APP_CONSTANTS } from '../../config';

const router: IRouter = Router();

const adminRoles = [
  APP_CONSTANTS.ROLES.SUPER_ADMIN,
  APP_CONSTANTS.ROLES.ADMIN,
  APP_CONSTANTS.ROLES.MANAGER,
];

// ==================== CATEGORY ROUTES ====================

// Public: list categories (for Customer PWA)
router.get('/categories', catalogController.getCategories);
router.get('/categories/:id', catalogController.getCategoryById);

// Admin: manage categories
router.post('/categories', authenticate, authorize(...adminRoles), validate(createCategorySchema), catalogController.createCategory);
router.patch('/categories/:id', authenticate, authorize(...adminRoles), validate(updateCategorySchema), catalogController.updateCategory);
router.delete('/categories/:id', authenticate, authorize(...adminRoles), catalogController.deleteCategory);

// ==================== UNIT ROUTES ====================

// Public: list units
router.get('/units', catalogController.getUnits);
router.get('/units/:id', catalogController.getUnitById);

// Admin: manage units
router.post('/units', authenticate, authorize(...adminRoles), validate(createUnitSchema), catalogController.createUnit);
router.patch('/units/:id', authenticate, authorize(...adminRoles), validate(updateUnitSchema), catalogController.updateUnit);
router.delete('/units/:id', authenticate, authorize(...adminRoles), catalogController.deleteUnit);

// ==================== BRAND ROUTES ====================

// Public: list brands
router.get('/brands', catalogController.getBrands);
router.get('/brands/:id', catalogController.getBrandById);

// Admin: manage brands
router.post('/brands', authenticate, authorize(...adminRoles), validate(createBrandSchema), catalogController.createBrand);
router.patch('/brands/:id', authenticate, authorize(...adminRoles), validate(updateBrandSchema), catalogController.updateBrand);
router.delete('/brands/:id', authenticate, authorize(...adminRoles), catalogController.deleteBrand);

// ==================== PRODUCT ROUTES ====================

// Public: list/view products (for Customer PWA)
router.get('/products', catalogController.getProducts);
router.get('/products/:id', catalogController.getProductById);
router.get('/products/slug/:slug', catalogController.getProductBySlug);

// Admin: manage products
router.post('/products', authenticate, authorize(...adminRoles), validate(createProductSchema), catalogController.createProduct);
router.patch('/products/:id', authenticate, authorize(...adminRoles), validate(updateProductSchema), catalogController.updateProduct);
router.delete('/products/:id', authenticate, authorize(...adminRoles), catalogController.deleteProduct);

export default router;
