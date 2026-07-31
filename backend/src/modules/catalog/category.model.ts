import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Schema.Types.ObjectId;
  sortOrder: number;
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  image: { type: String },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
});

categorySchema.plugin(baseSchemaPlugin);

// Indexes
categorySchema.index({ parent: 1 });
categorySchema.index({ sortOrder: 1 });

export const Category = model<ICategory>('Category', categorySchema);
