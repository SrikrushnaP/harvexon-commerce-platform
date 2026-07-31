import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface ISettings extends Document {
  // Business Identity
  businessName: string;
  tagline?: string;
  logo?: string;
  favicon?: string;

  // Contact
  contact: {
    phone: string;
    email: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };

  // Regional
  currency: string;
  currencySymbol: string;
  timezone: string;
  language: string;

  // Invoice
  invoicePrefix: string;
  invoiceStartNumber: number;
  gstNumber?: string;
  panNumber?: string;

  // Theme / Branding
  theme: {
    primaryColor: string;
    accentColor: string;
    headerBg?: string;
    footerText?: string;
  };

  // Business Hours
  businessHours?: {
    openTime: string;
    closeTime: string;
    workingDays: string[];
  };

  // Order Settings
  orderSettings: {
    minOrderAmount: number;
    deliveryCharge: number;
    freeDeliveryAbove: number;
    acceptOrders: boolean;
    orderCutoffTime?: string; // e.g., "22:00" — no orders after this time
    deliveryMessage?: string; // e.g., "Delivery within 2 hours" — shown on catalog page
    serviceablePincodes: string[]; // list of pincodes where delivery is available
  };

  // Notifications
  notifications: {
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
  };

  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
  },
  tagline: { type: String, trim: true },
  logo: { type: String },
  favicon: { type: String },

  contact: {
    phone: { type: String, required: [true, 'Contact phone is required'] },
    email: { type: String, required: [true, 'Contact email is required'] },
    address: { type: String, required: [true, 'Address is required'] },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' },
  },

  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  language: { type: String, default: 'en' },

  invoicePrefix: { type: String, default: 'INV' },
  invoiceStartNumber: { type: Number, default: 1 },
  gstNumber: { type: String },
  panNumber: { type: String },

  theme: {
    primaryColor: { type: String, default: '#2E7D32' },
    accentColor: { type: String, default: '#66BB6A' },
    headerBg: { type: String },
    footerText: { type: String },
  },

  businessHours: {
    openTime: { type: String },
    closeTime: { type: String },
    workingDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  },

  orderSettings: {
    minOrderAmount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    freeDeliveryAbove: { type: Number, default: 0 },
    acceptOrders: { type: Boolean, default: true },
    orderCutoffTime: { type: String },
    deliveryMessage: { type: String, trim: true },
    serviceablePincodes: { type: [String], default: [] },
  },

  notifications: {
    smsEnabled: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: false },
  },
});

// Apply base plugin
settingsSchema.plugin(baseSchemaPlugin);

export const Settings = model<ISettings>('Settings', settingsSchema);
