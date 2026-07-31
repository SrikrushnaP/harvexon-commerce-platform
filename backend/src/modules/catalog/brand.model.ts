import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrand>({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  logo: { type: String },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
});

brandSchema.plugin(baseSchemaPlugin);

export const Brand = model<IBrand>('Brand', brandSchema);
