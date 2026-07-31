import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface ICurrentLocation {
  lat: number;
  lng: number;
  updatedAt: Date;
}

export interface IDeliveryStaff extends Document {
  user?: Schema.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  isAvailable: boolean;
  currentLocation?: ICurrentLocation;
  completedDeliveries: number;
  rating: number;
  notes?: string;
  joinedAt: Date;
  // Common fields from plugin
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const deliveryStaffSchema = new Schema<IDeliveryStaff>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  vehicleType: {
    type: String,
    trim: true,
  },
  vehicleNumber: {
    type: String,
    trim: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date },
  },
  completedDeliveries: {
    type: Number,
    default: 0,
    min: [0, 'Completed deliveries cannot be negative'],
  },
  rating: {
    type: Number,
    default: 5,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

deliveryStaffSchema.plugin(baseSchemaPlugin);

// Indexes
deliveryStaffSchema.index({ isAvailable: 1 });
deliveryStaffSchema.index({ user: 1 }, { sparse: true });

export const DeliveryStaff = model<IDeliveryStaff>('DeliveryStaff', deliveryStaffSchema);
