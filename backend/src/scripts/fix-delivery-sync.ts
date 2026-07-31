/**
 * One-off script to sync delivery assignment statuses with their order statuses.
 * Fixes cases where order status was updated before the sync logic existed.
 * Run: npx tsx src/scripts/fix-delivery-sync.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Order } from '../modules/order/order.model';
import { DeliveryAssignment } from '../modules/delivery/delivery-assignment.model';

const ORDER_TO_DELIVERY_STATUS: Record<string, string> = {
  out_for_delivery: 'in_transit',
  delivered: 'delivered',
  cancelled: 'failed',
};

async function fixDeliverySync() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcp';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Find all active delivery assignments
  const assignments = await DeliveryAssignment.find({ isActive: true });

  let fixed = 0;
  for (const assignment of assignments) {
    const order = await Order.findById(assignment.order).select('status orderNumber');
    if (!order) continue;

    const expectedDeliveryStatus = ORDER_TO_DELIVERY_STATUS[order.status];
    if (expectedDeliveryStatus && assignment.status !== expectedDeliveryStatus) {
      console.log(
        `Fixing ${order.orderNumber}: delivery status "${assignment.status}" → "${expectedDeliveryStatus}" (order is "${order.status}")`
      );
      assignment.status = expectedDeliveryStatus as any;
      if (expectedDeliveryStatus === 'delivered') {
        assignment.deliveredAt = new Date();
      }
      await assignment.save();
      fixed++;
    }
  }

  console.log(`\nDone. Fixed ${fixed} assignment(s).`);
  await mongoose.disconnect();
}

fixDeliverySync().catch((err) => {
  console.error(err);
  process.exit(1);
});
