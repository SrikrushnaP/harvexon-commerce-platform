import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface ISupplierAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ISupplierBankDetails {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  ifsc?: string;
}

export interface ISupplier extends Document {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: ISupplierAddress;
  gstin?: string;
  paymentTerms?: string;
  bankDetails?: ISupplierBankDetails;
  notes?: string;
  tags: string[];
  totalPurchases: number;
  totalSpent: number;
  // Common fields from plugin
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    unique: true,
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters'],
  },
  contactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  gstin: {
    type: String,
    trim: true,
  },
  paymentTerms: {
    type: String,
    trim: true,
  },
  bankDetails: {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    ifsc: { type: String, trim: true },
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  tags: {
    type: [String],
    default: [],
  },
  totalPurchases: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
});

supplierSchema.plugin(baseSchemaPlugin);

// Indexes (name unique index already created by `unique: true` in schema field)
supplierSchema.index({ phone: 1 });
supplierSchema.index({ tags: 1 });

export const Supplier = model<ISupplier>('Supplier', supplierSchema);
