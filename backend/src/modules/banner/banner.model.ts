import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export type BannerType = 'offer' | 'announcement' | 'promo';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  type: BannerType;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [500, 'Subtitle cannot exceed 500 characters'],
  },
  image: {
    type: String,
    trim: true,
  },
  link: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['offer', 'announcement', 'promo'],
    default: 'offer',
  },
  bgColor: {
    type: String,
    default: '#f0fdf4',
  },
  textColor: {
    type: String,
    default: '#065f46',
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
});

bannerSchema.plugin(baseSchemaPlugin);

bannerSchema.index({ sortOrder: 1 });
bannerSchema.index({ type: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

export const Banner = model<IBanner>('Banner', bannerSchema);
