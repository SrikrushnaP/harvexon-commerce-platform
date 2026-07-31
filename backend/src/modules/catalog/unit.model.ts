import { Schema, model, Document } from 'mongoose';
import { baseSchemaPlugin } from '../../database';

export interface IUnit extends Document {
  name: string;        // Kilogram, Gram, Piece, Bunch, Litre, Dozen
  shortName: string;   // kg, g, pc, bunch, L, dz
  isActive: boolean;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const unitSchema = new Schema<IUnit>({
  name: {
    type: String,
    required: [true, 'Unit name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Unit name cannot exceed 50 characters'],
  },
  shortName: {
    type: String,
    required: [true, 'Short name is required'],
    trim: true,
    unique: true,
    maxlength: [10, 'Short name cannot exceed 10 characters'],
  },
});

unitSchema.plugin(baseSchemaPlugin);

export const Unit = model<IUnit>('Unit', unitSchema);
