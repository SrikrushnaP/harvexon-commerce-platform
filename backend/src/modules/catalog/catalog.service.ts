import { Category, ICategory } from './category.model';
import { Unit, IUnit } from './unit.model';
import { Brand, IBrand } from './brand.model';
import { Product, IProduct } from './product.model';
import { NotFoundError, ConflictError } from '../../common/middleware';
import { parsePagination, buildPaginationMeta, PaginationOptions } from '../../common/utils';
import { PaginationQuery } from '../../common/types';

/**
 * Generate URL-friendly slug from a string
 */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// ==================== CATEGORY SERVICE ====================

class CategoryService {
  async create(data: Partial<ICategory>, userId?: string): Promise<ICategory> {
    const slug = generateSlug(data.name!);
    
    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    return Category.create({ ...data, slug, createdBy: userId });
  }

  async getAll(query: PaginationQuery & { parent?: string }): Promise<any> {
    const { skip, limit, sort, page } = parsePagination(query);
    
    const filter: any = {};
    if (query.parent) {
      filter.parent = query.parent;
    } else if (query.parent === undefined) {
      // Default: get root categories (no parent)
      // Only apply if parent is not explicitly passed
    }

    const [data, total] = await Promise.all([
      Category.find(filter).sort(sort).skip(skip).limit(limit).populate('parent', 'name slug'),
      Category.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<ICategory> {
    const category = await Category.findById(id).populate('parent', 'name slug');
    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async update(id: string, data: Partial<ICategory>, userId?: string): Promise<ICategory> {
    if (data.name) {
      data.slug = generateSlug(data.name);
      const existing = await Category.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) throw new ConflictError('Category with this name already exists');
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) throw new NotFoundError('Category');
    
    // Check for child categories
    const children = await Category.countDocuments({ parent: id });
    if (children > 0) {
      throw new ConflictError('Cannot delete category with subcategories. Remove children first.');
    }

    // Check for products in this category
    const products = await Product.countDocuments({ category: id });
    if (products > 0) {
      throw new ConflictError('Cannot delete category with products. Move or remove products first.');
    }

    await (category as any).softDelete(userId);
  }
}

// ==================== UNIT SERVICE ====================

class UnitService {
  async create(data: Partial<IUnit>, userId?: string): Promise<IUnit> {
    const existing = await Unit.findOne({ 
      $or: [{ name: data.name }, { shortName: data.shortName }] 
    });
    if (existing) throw new ConflictError('Unit with this name or short name already exists');

    return Unit.create({ ...data, createdBy: userId });
  }

  async getAll(): Promise<IUnit[]> {
    return Unit.find().sort({ name: 1 });
  }

  async getById(id: string): Promise<IUnit> {
    const unit = await Unit.findById(id);
    if (!unit) throw new NotFoundError('Unit');
    return unit;
  }

  async update(id: string, data: Partial<IUnit>, userId?: string): Promise<IUnit> {
    if (data.name || data.shortName) {
      const filter: any = { _id: { $ne: id } };
      if (data.name) filter.name = data.name;
      if (data.shortName) filter.shortName = data.shortName;
      
      const existing = await Unit.findOne(filter);
      if (existing) throw new ConflictError('Unit with this name or short name already exists');
    }

    const unit = await Unit.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!unit) throw new NotFoundError('Unit');
    return unit;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const unit = await Unit.findById(id);
    if (!unit) throw new NotFoundError('Unit');

    const products = await Product.countDocuments({ unit: id });
    if (products > 0) {
      throw new ConflictError('Cannot delete unit used by products. Update products first.');
    }

    await (unit as any).softDelete(userId);
  }
}

// ==================== BRAND SERVICE ====================

class BrandService {
  async create(data: Partial<IBrand>, userId?: string): Promise<IBrand> {
    const slug = generateSlug(data.name!);
    
    const existing = await Brand.findOne({ slug });
    if (existing) throw new ConflictError('Brand with this name already exists');

    return Brand.create({ ...data, slug, createdBy: userId });
  }

  async getAll(): Promise<IBrand[]> {
    return Brand.find().sort({ name: 1 });
  }

  async getById(id: string): Promise<IBrand> {
    const brand = await Brand.findById(id);
    if (!brand) throw new NotFoundError('Brand');
    return brand;
  }

  async update(id: string, data: Partial<IBrand>, userId?: string): Promise<IBrand> {
    if (data.name) {
      data.slug = generateSlug(data.name);
      const existing = await Brand.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) throw new ConflictError('Brand with this name already exists');
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!brand) throw new NotFoundError('Brand');
    return brand;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const brand = await Brand.findById(id);
    if (!brand) throw new NotFoundError('Brand');

    const products = await Product.countDocuments({ brand: id });
    if (products > 0) {
      throw new ConflictError('Cannot delete brand used by products. Update products first.');
    }

    await (brand as any).softDelete(userId);
  }
}

// ==================== PRODUCT SERVICE ====================

class ProductService {
  async create(data: Partial<IProduct>, userId?: string): Promise<IProduct> {
    const slug = generateSlug(data.name!);
    
    const existing = await Product.findOne({ slug });
    if (existing) throw new ConflictError('Product with this name already exists');

    // Validate references exist
    const category = await Category.findById(data.category);
    if (!category) throw new NotFoundError('Category');

    const unit = await Unit.findById(data.unit);
    if (!unit) throw new NotFoundError('Unit');

    if (data.brand) {
      const brand = await Brand.findById(data.brand);
      if (!brand) throw new NotFoundError('Brand');
    }

    const product = await Product.create({ ...data, slug, createdBy: userId });
    return product.populate(['category', 'brand', 'unit']);
  }

  async getAll(query: PaginationQuery & { 
    category?: string; 
    brand?: string; 
    search?: string;
    isFeatured?: string;
    isAvailable?: string;
  }): Promise<any> {
    const { skip, limit, sort, page } = parsePagination(query);
    
    const filter: any = {};
    if (query.category) filter.category = query.category;
    if (query.brand) filter.brand = query.brand;
    if (query.isFeatured === 'true') filter.isFeatured = true;
    if (query.isAvailable === 'true') filter.isAvailable = true;
    if (query.isAvailable === 'false') filter.isAvailable = false;
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const [data, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .populate('unit', 'name shortName'),
      Product.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('unit', 'name shortName');
    if (!product) throw new NotFoundError('Product');
    return product;
  }

  async getBySlug(slug: string): Promise<IProduct> {
    const product = await Product.findOne({ slug })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('unit', 'name shortName');
    if (!product) throw new NotFoundError('Product');
    return product;
  }

  async update(id: string, data: Partial<IProduct>, userId?: string): Promise<IProduct> {
    if (data.name) {
      data.slug = generateSlug(data.name);
      const existing = await Product.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) throw new ConflictError('Product with this name already exists');
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('unit', 'name shortName');

    if (!product) throw new NotFoundError('Product');
    return product;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product');
    await (product as any).softDelete(userId);
  }
}

// Export service instances
export const categoryService = new CategoryService();
export const unitService = new UnitService();
export const brandService = new BrandService();
export const productService = new ProductService();
