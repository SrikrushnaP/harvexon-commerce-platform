import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface IAddress extends Document {
  customer: Schema.Types.ObjectId;
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
  isDefault: boolean;
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required'],
  },
  label: {
    type: String,
    trim: true,
    maxlength: [50, 'Label cannot exceed 50 characters'],
  },
  line1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: [200, 'Address line 1 cannot exceed 200 characters'],
  },
  line2: {
    type: String,
    trim: true,
    maxlength: [200, 'Address line 2 cannot exceed 200 characters'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters'],
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    maxlength: [10, 'Pincode cannot exceed 10 characters'],
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [200, 'Landmark cannot exceed 200 characters'],
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

addressSchema.plugin(baseSchemaPlugin);

// Indexes
addressSchema.index({ customer: 1 });

// Pre-save middleware: when setting isDefault=true, unset other addresses' isDefault for same customer
addressSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await model('Address').updateMany(
      { customer: this.customer, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export const Address = model<IAddress>('Address', addressSchema);
