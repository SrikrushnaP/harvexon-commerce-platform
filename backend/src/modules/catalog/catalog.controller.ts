import { Request, Response } from 'express';
import { categoryService, unitService, brandService, productService } from './catalog.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../common/utils';
import { AuthRequest } from '../../common/types';

// Helper to get param as string
const getParam = (req: Request, key: string): string => req.params[key] as string;

// ==================== CATEGORY CONTROLLERS ====================

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const category = await categoryService.create(req.body, user?.id);
  sendCreated(res, { category }, 'Category created successfully');
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.getAll(req.query as any);
  sendPaginated(res, result, 'Categories retrieved');
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getById(getParam(req, 'id'));
  sendSuccess(res, { category }, 'Category retrieved');
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const category = await categoryService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { category }, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await categoryService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});

// ==================== UNIT CONTROLLERS ====================

export const createUnit = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const unit = await unitService.create(req.body, user?.id);
  sendCreated(res, { unit }, 'Unit created successfully');
});

export const getUnits = asyncHandler(async (_req: Request, res: Response) => {
  const units = await unitService.getAll();
  sendSuccess(res, { units }, 'Units retrieved');
});

export const getUnitById = asyncHandler(async (req: Request, res: Response) => {
  const unit = await unitService.getById(getParam(req, 'id'));
  sendSuccess(res, { unit }, 'Unit retrieved');
});

export const updateUnit = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const unit = await unitService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { unit }, 'Unit updated');
});

export const deleteUnit = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await unitService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});

// ==================== BRAND CONTROLLERS ====================

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const brand = await brandService.create(req.body, user?.id);
  sendCreated(res, { brand }, 'Brand created successfully');
});

export const getBrands = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await brandService.getAll();
  sendSuccess(res, { brands }, 'Brands retrieved');
});

export const getBrandById = asyncHandler(async (req: Request, res: Response) => {
  const brand = await brandService.getById(getParam(req, 'id'));
  sendSuccess(res, { brand }, 'Brand retrieved');
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const brand = await brandService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { brand }, 'Brand updated');
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await brandService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});

// ==================== PRODUCT CONTROLLERS ====================

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const product = await productService.create(req.body, user?.id);
  sendCreated(res, { product }, 'Product created successfully');
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.getAll(req.query as any);
  sendPaginated(res, result, 'Products retrieved');
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getById(getParam(req, 'id'));
  sendSuccess(res, { product }, 'Product retrieved');
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getBySlug(getParam(req, 'slug'));
  sendSuccess(res, { product }, 'Product retrieved');
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const product = await productService.update(getParam(req, 'id'), req.body, user?.id);
  sendSuccess(res, { product }, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  await productService.delete(getParam(req, 'id'), user?.id);
  sendNoContent(res);
});
