import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';
import { DeliveryStatus } from '../../config';
import { APP_CONSTANTS } from '../../config';

export interface IRoutePoint {
  lat: number;
  lng: number;
  timestamp: Date;
}

export interface IDeliveryAssignment extends Document {
  order: Schema.Types.ObjectId;
  deliveryStaff: Schema.Types.ObjectId;
  status: DeliveryStatus;
  assignedAt: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  proofOfDelivery?: string;
  customerRating?: number;
  customerFeedback?: string;
  notes?: string;
  distance?: number;
  estimatedTime?: number;
  route?: IRoutePoint[];
  // Common fields from plugin
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const deliveryAssignmentSchema = new Schema<IDeliveryAssignment>({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required'],
  },
  deliveryStaff: {
    type: Schema.Types.ObjectId,
    ref: 'DeliveryStaff',
    required: [true, 'Delivery staff is required'],
  },
  status: {
    type: String,
    enum: Object.values(APP_CONSTANTS.DELIVERY_STATUS),
    default: APP_CONSTANTS.DELIVERY_STATUS.PENDING,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  pickedUpAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  failedAt: {
    type: Date,
  },
  failureReason: {
    type: String,
    maxlength: [500, 'Failure reason cannot exceed 500 characters'],
  },
  proofOfDelivery: {
    type: String,
  },
  customerRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  customerFeedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  distance: {
    type: Number,
    min: [0, 'Distance cannot be negative'],
  },
  estimatedTime: {
    type: Number,
    min: [0, 'Estimated time cannot be negative'],
  },
  route: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      timestamp: { type: Date, required: true },
    },
  ],
});

deliveryAssignmentSchema.plugin(baseSchemaPlugin);

// Indexes
deliveryAssignmentSchema.index({ order: 1 });
deliveryAssignmentSchema.index({ deliveryStaff: 1, status: 1 });
deliveryAssignmentSchema.index({ status: 1, assignedAt: -1 });

export const DeliveryAssignment = model<IDeliveryAssignment>(
  'DeliveryAssignment',
  deliveryAssignmentSchema
);
