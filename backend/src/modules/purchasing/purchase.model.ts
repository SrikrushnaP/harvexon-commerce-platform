import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export type PurchaseStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface IPurchaseItem {
  product: Schema.Types.ObjectId;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface IPurchase extends Document {
  purchaseNumber: string;
  supplier: Schema.Types.ObjectId;
  items: IPurchaseItem[];
  status: PurchaseStatus;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  notes?: string;
  expectedDeliveryDate?: Date;
  receivedDate?: Date;
  purchaseDate: Date;
  // Common fields from plugin
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseItemSchema = new Schema(
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
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
  },
  { _id: false }
);

const purchaseSchema = new Schema<IPurchase>({
  purchaseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required'],
  },
  items: {
    type: [purchaseItemSchema],
    required: [true, 'At least one item is required'],
    validate: [(val: any[]) => val.length > 0, 'At least one item is required'],
  },
  status: {
    type: String,
    enum: ['draft', 'ordered', 'partial', 'received', 'cancelled'],
    default: 'draft',
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative'],
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative'],
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
  expectedDeliveryDate: {
    type: Date,
  },
  receivedDate: {
    type: Date,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
});

purchaseSchema.plugin(baseSchemaPlugin);

// Indexes
purchaseSchema.index({ supplier: 1, purchaseDate: -1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ purchaseDate: -1 });

export const Purchase = model<IPurchase>('Purchase', purchaseSchema);
