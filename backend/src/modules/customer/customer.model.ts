import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  group: Schema.Types.ObjectId;
  gstin?: string;
  businessName?: string;
  notes?: string;
  tags: string[];
  creditBalance: number;
  outstandingBalance: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'CustomerGroup',
    required: [true, 'Customer group is required'],
  },
  gstin: {
    type: String,
    trim: true,
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: [200, 'Business name cannot exceed 200 characters'],
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  tags: {
    type: [String],
    default: [],
  },
  creditBalance: {
    type: Number,
    default: 0,
  },
  outstandingBalance: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  lastOrderDate: {
    type: Date,
  },
});

customerSchema.plugin(baseSchemaPlugin);

// Indexes (phone unique index is already created by `unique: true` in schema field)
customerSchema.index({ group: 1 });
customerSchema.index({ tags: 1 });

export const Customer = model<ICustomer>('Customer', customerSchema);
