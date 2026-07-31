import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface ICartItem {
  product: Schema.Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  customer: Schema.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

const cartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
}, { _id: true });

const cartSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

cartSchema.plugin(baseSchemaPlugin);

export const Cart = model<ICart>('Cart', cartSchema);
