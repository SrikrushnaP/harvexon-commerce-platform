import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';
import { CustomerGroupType } from '../../config';
import { APP_CONSTANTS } from '../../config';

export interface ICustomerGroup extends Document {
  name: string;
  type: CustomerGroupType;
  description?: string;
  discountPercent: number;
  minOrderAmount: number;
  creditLimit: number;
  creditPeriodDays: number;
  paymentTerms?: string;
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerGroupSchema = new Schema<ICustomerGroup>({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Group name cannot exceed 100 characters'],
  },
  type: {
    type: String,
    required: [true, 'Group type is required'],
    enum: Object.values(APP_CONSTANTS.CUSTOMER_GROUP_TYPE),
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100'],
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative'],
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative'],
  },
  creditPeriodDays: {
    type: Number,
    default: 0,
    min: [0, 'Credit period cannot be negative'],
  },
  paymentTerms: {
    type: String,
    maxlength: [500, 'Payment terms cannot exceed 500 characters'],
  },
});

customerGroupSchema.plugin(baseSchemaPlugin);

export const CustomerGroup = model<ICustomerGroup>('CustomerGroup', customerGroupSchema);
