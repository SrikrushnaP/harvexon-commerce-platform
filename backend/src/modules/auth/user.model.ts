import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { baseSchemaPlugin } from '../../database';
import { APP_CONSTANTS, Role } from '../../config';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  notificationPreferences?: {
    orderUpdates: boolean;
    promotions: boolean;
    deliveryAlerts: boolean;
  };
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  softDelete(userId?: string): Promise<IUser>;
  restore(userId?: string): Promise<IUser>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include in queries by default
  },
  role: {
    type: String,
    enum: Object.values(APP_CONSTANTS.ROLES),
    default: APP_CONSTANTS.ROLES.CUSTOMER,
  },
  lastLogin: {
    type: Date,
  },
  notificationPreferences: {
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    deliveryAlerts: { type: Boolean, default: true },
  },
  refreshToken: {
    type: String,
    select: false,
  },
});

// Apply base plugin (soft delete, timestamps, audit, toJSON)
userSchema.plugin(baseSchemaPlugin);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes (role doesn't have unique, so we index it manually)
userSchema.index({ role: 1 });

export const User = model<IUser>('User', userSchema);
