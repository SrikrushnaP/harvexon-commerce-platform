import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';
import { OrderStatus } from '../../config';
import { APP_CONSTANTS } from '../../config';

export interface IOrderItem {
  product: Schema.Types.ObjectId;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IDeliveryAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  timestamp: Date;
  changedBy?: Schema.Types.ObjectId;
  notes?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: Schema.Types.ObjectId;
  deliveryAddress: IDeliveryAddress;
  items: IOrderItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'cod' | 'upi' | 'bank_transfer' | 'credit';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  notes?: string;
  internalNotes?: string;
  orderDate: Date;
  confirmedAt?: Date;
  packedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  statusHistory: IStatusHistoryEntry[];
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative'],
    },
  },
  { _id: false }
);

const deliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    label: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      required: true,
      enum: Object.values(APP_CONSTANTS.ORDER_STATUS),
    },
    timestamp: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true,
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required'],
  },
  deliveryAddress: {
    type: deliveryAddressSchema,
    required: [true, 'Delivery address is required'],
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Order items are required'],
    validate: [(val: IOrderItem[]) => val.length > 0, 'At least one item is required'],
  },
  status: {
    type: String,
    enum: Object.values(APP_CONSTANTS.ORDER_STATUS),
    default: APP_CONSTANTS.ORDER_STATUS.DRAFT,
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: [0, 'Delivery charge cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative'],
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['cash', 'cod', 'upi', 'bank_transfer', 'credit'],
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  internalNotes: {
    type: String,
    maxlength: [2000, 'Internal notes cannot exceed 2000 characters'],
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  confirmedAt: { type: Date },
  packedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  statusHistory: {
    type: [statusHistorySchema],
    default: [],
  },
});

orderSchema.plugin(baseSchemaPlugin);

// Indexes (orderNumber unique index already created by `unique: true` in schema field)
orderSchema.index({ customer: 1, orderDate: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });

export const Order = model<IOrder>('Order', orderSchema);
