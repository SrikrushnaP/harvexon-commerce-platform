import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';
import { PricingType } from '../../config';
import { APP_CONSTANTS } from '../../config';

export interface IPriceRule extends Document {
  product: Schema.Types.ObjectId;
  type: PricingType;
  group?: Schema.Types.ObjectId;
  customer?: Schema.Types.ObjectId;
  price: number;
  minQuantity: number;
  maxQuantity?: number;
  discountPercent?: number;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  notes?: string;
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const priceRuleSchema = new Schema<IPriceRule>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
  },
  type: {
    type: String,
    required: [true, 'Pricing type is required'],
    enum: Object.values(APP_CONSTANTS.PRICING_TYPE),
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'CustomerGroup',
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  minQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Minimum quantity must be at least 1'],
  },
  maxQuantity: {
    type: Number,
    min: [1, 'Maximum quantity must be at least 1'],
  },
  discountPercent: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100'],
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  priority: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
});

priceRuleSchema.plugin(baseSchemaPlugin);

// Indexes
priceRuleSchema.index({ product: 1, type: 1 });
priceRuleSchema.index(
  { product: 1, group: 1, type: 1 },
  { unique: true, partialFilterExpression: { group: { $exists: true, $ne: null } } }
);
priceRuleSchema.index(
  { product: 1, customer: 1, type: 1 },
  { unique: true, partialFilterExpression: { customer: { $exists: true, $ne: null } } }
);
priceRuleSchema.index({ product: 1, type: 1, minQuantity: 1 });

export const PriceRule = model<IPriceRule>('PriceRule', priceRuleSchema);
