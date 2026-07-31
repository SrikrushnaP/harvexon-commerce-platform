import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';
import { CouponType } from '../../config';
import { APP_CONSTANTS } from '../../config';

export interface IUsageHistoryEntry {
  customer: Schema.Types.ObjectId;
  order: Schema.Types.ObjectId;
  usedAt: Date;
}

export interface IProductCondition {
  product: Schema.Types.ObjectId;
  specialPrice: number;
  quantity: number;
}

export interface IBuyXGetY {
  product: Schema.Types.ObjectId;
  buyQty: number;
  getQty: number;
}

export interface ICoupon extends Document {
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  discountPercent?: number;
  maxDiscount?: number;
  flatAmount?: number;
  minCartValue: number;
  productCondition?: IProductCondition;
  buyXGetY?: IBuyXGetY;
  applicableCategories: Schema.Types.ObjectId[];
  applicableProducts: Schema.Types.ObjectId[];
  excludedProducts: Schema.Types.ObjectId[];
  customerGroups: Schema.Types.ObjectId[];
  specificCustomers: Schema.Types.ObjectId[];
  maxTotalUses?: number;
  maxUsesPerCustomer: number;
  currentUses: number;
  usageHistory: IUsageHistoryEntry[];
  startDate: Date;
  endDate: Date;
  isCombinable: boolean;
  autoApply: boolean;
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const usageHistorySchema = new Schema<IUsageHistoryEntry>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const productConditionSchema = new Schema<IProductCondition>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    specialPrice: {
      type: Number,
      required: true,
      min: [0, 'Special price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
  },
  { _id: false }
);

const buyXGetYSchema = new Schema<IBuyXGetY>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    buyQty: {
      type: Number,
      required: true,
      min: [1, 'Buy quantity must be at least 1'],
    },
    getQty: {
      type: Number,
      required: true,
      min: [1, 'Get quantity must be at least 1'],
    },
  },
  { _id: false }
);

const couponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [50, 'Coupon code cannot exceed 50 characters'],
  },
  title: {
    type: String,
    required: [true, 'Coupon title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  type: {
    type: String,
    required: [true, 'Coupon type is required'],
    enum: Object.values(APP_CONSTANTS.COUPON_TYPE),
  },
  discountPercent: {
    type: Number,
    min: [0, 'Discount percent cannot be negative'],
    max: [100, 'Discount percent cannot exceed 100'],
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Max discount cannot be negative'],
  },
  flatAmount: {
    type: Number,
    min: [0, 'Flat amount cannot be negative'],
  },
  minCartValue: {
    type: Number,
    default: 0,
    min: [0, 'Minimum cart value cannot be negative'],
  },
  productCondition: {
    type: productConditionSchema,
  },
  buyXGetY: {
    type: buyXGetYSchema,
  },
  applicableCategories: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    default: [],
  },
  applicableProducts: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    default: [],
  },
  excludedProducts: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    default: [],
  },
  customerGroups: {
    type: [{ type: Schema.Types.ObjectId, ref: 'CustomerGroup' }],
    default: [],
  },
  specificCustomers: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
    default: [],
  },
  maxTotalUses: {
    type: Number,
    min: [0, 'Max total uses cannot be negative'],
  },
  maxUsesPerCustomer: {
    type: Number,
    default: 1,
    min: [1, 'Max uses per customer must be at least 1'],
  },
  currentUses: {
    type: Number,
    default: 0,
    min: [0, 'Current uses cannot be negative'],
  },
  usageHistory: {
    type: [usageHistorySchema],
    default: [],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  isCombinable: {
    type: Boolean,
    default: false,
  },
  autoApply: {
    type: Boolean,
    default: false,
  },
});

couponSchema.plugin(baseSchemaPlugin);

// Indexes
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ autoApply: 1, isActive: 1 });
couponSchema.index({ type: 1 });

export const Coupon = model<ICoupon>('Coupon', couponSchema);
