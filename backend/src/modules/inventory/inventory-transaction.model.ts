import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';
import { InventoryTransactionType } from '../../config';

export interface IInventoryTransaction extends Document {
  product: Schema.Types.ObjectId;
  type: InventoryTransactionType;
  quantity: number;
  direction: 'in' | 'out';
  referenceType?: string;
  referenceId?: Schema.Types.ObjectId;
  batchNumber?: string;
  expiryDate?: Date;
  unitCost?: number;
  notes?: string;
  transactionDate: Date;
  // Common fields from plugin
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryTransactionSchema = new Schema<IInventoryTransaction>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
  },
  type: {
    type: String,
    enum: ['purchase', 'sale', 'return', 'damage', 'adjustment', 'transfer'],
    required: [true, 'Transaction type is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be positive'],
  },
  direction: {
    type: String,
    enum: ['in', 'out'],
    required: [true, 'Direction is required'],
  },
  referenceType: {
    type: String,
    enum: ['order', 'purchase', 'manual'],
  },
  referenceId: {
    type: Schema.Types.ObjectId,
  },
  batchNumber: {
    type: String,
    trim: true,
  },
  expiryDate: {
    type: Date,
  },
  unitCost: {
    type: Number,
    min: [0, 'Unit cost cannot be negative'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  transactionDate: {
    type: Date,
    default: Date.now,
  },
});

inventoryTransactionSchema.plugin(baseSchemaPlugin);

// Indexes
inventoryTransactionSchema.index({ product: 1, transactionDate: -1 });
inventoryTransactionSchema.index({ product: 1, type: 1 });
inventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });
inventoryTransactionSchema.index({ transactionDate: -1 });
inventoryTransactionSchema.index({ batchNumber: 1 }, { sparse: true });

export const InventoryTransaction = model<IInventoryTransaction>(
  'InventoryTransaction',
  inventoryTransactionSchema
);
