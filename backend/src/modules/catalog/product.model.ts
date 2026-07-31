import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  category: Schema.Types.ObjectId;
  brand?: Schema.Types.ObjectId;
  unit: Schema.Types.ObjectId;
  // Base price (default retail price)
  basePrice: number;
  // Product images
  images: string[];
  // Product attributes (flexible, industry-specific)
  attributes?: Record<string, any>;
  // Flags
  isFeatured: boolean;
  isAvailable: boolean;
  // SEO / Display
  tags?: string[];
  sortOrder: number;
  // Inventory
  trackInventory: boolean;
  lowStockThreshold: number;
  // Common fields from plugin
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
    sparse: true,
    unique: true,
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
  },
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: [true, 'Unit is required'],
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative'],
  },
  images: {
    type: [String],
    default: [],
  },
  attributes: {
    type: Schema.Types.Mixed,
    default: {},
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  trackInventory: {
    type: Boolean,
    default: true,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
});

productSchema.plugin(baseSchemaPlugin);

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product = model<IProduct>('Product', productSchema);
