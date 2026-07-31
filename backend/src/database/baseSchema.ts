import { Schema } from 'mongoose';

/**
 * Base plugin that adds common fields to all schemas:
 * - isActive: soft delete flag
 * - createdBy / updatedBy: audit trail
 * - timestamps: createdAt, updatedAt (handled by Mongoose)
 * 
 * Usage: schema.plugin(baseSchemaPlugin);
 */
export const baseSchemaPlugin = (schema: Schema): void => {
  // Soft delete
  schema.add({
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  });

  // Audit fields
  schema.add({
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  });

  // Ensure timestamps are enabled
  schema.set('timestamps', true);

  // Default toJSON transformation
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    },
  });

  // Default query: exclude soft-deleted records
  schema.pre(/^find/, function (this: any, next) {
    // Only apply if not explicitly querying for inactive
    if (this.getQuery().isActive === undefined) {
      this.where({ isActive: true });
    }
    next();
  });

  // Soft delete method
  schema.methods.softDelete = function (userId?: string) {
    this.isActive = false;
    if (userId) this.updatedBy = userId;
    return this.save();
  };

  // Restore method
  schema.methods.restore = function (userId?: string) {
    this.isActive = true;
    if (userId) this.updatedBy = userId;
    return this.save();
  };
};
