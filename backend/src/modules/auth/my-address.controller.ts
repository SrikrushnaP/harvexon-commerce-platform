import { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendNoContent } from '../../common/utils';
import { AuthRequest } from '../../common/types';
import { Customer, CustomerGroup, Address } from '../customer';
import { User } from './user.model';

/**
 * Find or create a Customer record for the logged-in user.
 * Uses the same logic as order creation to ensure consistency.
 */
async function getOrCreateCustomer(userId: string) {
  const fullUser = await User.findById(userId);
  if (!fullUser) throw new Error('User not found');

  let customer = await Customer.findOne({
    $or: [
      ...(fullUser.email ? [{ email: fullUser.email }] : []),
      ...(fullUser.phone ? [{ phone: fullUser.phone }] : []),
    ],
  });

  if (!customer) {
    let defaultGroup = await CustomerGroup.findOne({ name: 'Walk-in' });
    if (!defaultGroup) {
      defaultGroup = await CustomerGroup.findOne();
    }

    customer = await Customer.create({
      name: fullUser.name || 'Customer',
      phone: fullUser.phone || '0000000000',
      email: fullUser.email,
      group: defaultGroup?._id,
      isActive: true,
    });
  }

  return customer;
}

// GET /api/auth/addresses - List my addresses
export const getMyAddresses = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const customer = await getOrCreateCustomer(user!.id);

  const addresses = await Address.find({ customer: customer._id })
    .sort({ isDefault: -1, createdAt: -1 });

  sendSuccess(res, { addresses }, 'Addresses retrieved');
});

// POST /api/auth/addresses - Create a new address
export const createMyAddress = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const customer = await getOrCreateCustomer(user!.id);

  // If setting as default, unset others
  if (req.body.isDefault) {
    await Address.updateMany(
      { customer: customer._id },
      { isDefault: false }
    );
  }

  // If this is the first address, make it default
  const existingCount = await Address.countDocuments({ customer: customer._id });
  const isDefault = req.body.isDefault ?? (existingCount === 0);

  const address = await Address.create({
    ...req.body,
    customer: customer._id,
    isDefault,
    createdBy: user!.id,
  });

  sendCreated(res, { address }, 'Address created successfully');
});

// PATCH /api/auth/addresses/:id - Update my address
export const updateMyAddress = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const customer = await getOrCreateCustomer(user!.id);

  const address = await Address.findOne({
    _id: req.params.id,
    customer: customer._id,
  });

  if (!address) {
    res.status(404).json({ success: false, message: 'Address not found' });
    return;
  }

  // If setting as default, unset others
  if (req.body.isDefault) {
    await Address.updateMany(
      { customer: customer._id, _id: { $ne: address._id } },
      { isDefault: false }
    );
  }

  const updated = await Address.findByIdAndUpdate(
    address._id,
    { ...req.body, updatedBy: user!.id },
    { new: true, runValidators: true }
  );

  sendSuccess(res, { address: updated }, 'Address updated');
});

// DELETE /api/auth/addresses/:id - Delete my address
export const deleteMyAddress = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const customer = await getOrCreateCustomer(user!.id);

  const address = await Address.findOne({
    _id: req.params.id,
    customer: customer._id,
  });

  if (!address) {
    res.status(404).json({ success: false, message: 'Address not found' });
    return;
  }

  const wasDefault = address.isDefault;
  await (address as any).softDelete(user!.id);

  // If deleted address was default, set another as default
  if (wasDefault) {
    const another = await Address.findOne({ customer: customer._id }).sort({ createdAt: -1 });
    if (another) {
      another.isDefault = true;
      await another.save();
    }
  }

  sendNoContent(res);
});
