import { Request, Response } from 'express';
import { orderService } from './order.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils';
import { AuthRequest } from '../../common/types';
import { Customer, CustomerGroup } from '../customer';
import { User } from '../auth/user.model';

// Helper to get param as string
const getParam = (req: Request, key: string): string => req.params[key] as string;

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  let body = { ...req.body };

  // For customer-placed orders: find or create a Customer record
  if (user?.role === 'customer') {
    const fullUser = await User.findById(user.id);

    let customer = await Customer.findOne({
      $or: [
        ...(fullUser?.email ? [{ email: fullUser.email }] : []),
        ...(fullUser?.phone ? [{ phone: fullUser.phone }] : []),
      ],
    });

    if (!customer) {
      // Get or create a default customer group
      let defaultGroup = await CustomerGroup.findOne({ name: 'Walk-in' });
      if (!defaultGroup) {
        defaultGroup = await CustomerGroup.findOne();
      }

      customer = await Customer.create({
        name: fullUser?.name || 'Customer',
        phone: fullUser?.phone || '0000000000',
        email: fullUser?.email,
        group: defaultGroup?._id,
        isActive: true,
      });
    }

    body.customer = (customer._id as any).toString();
  }

  const order = await orderService.create(body, user?.id);
  sendCreated(res, { order }, 'Order created successfully');
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const query = { ...(req.query as any) };

  // Customers can only see their own orders
  if (user?.role === 'customer') {
    const fullUser = await User.findById(user.id);
    const customer = await Customer.findOne({
      $or: [
        ...(fullUser?.email ? [{ email: fullUser.email }] : []),
        ...(fullUser?.phone ? [{ phone: fullUser.phone }] : []),
      ],
    });
    if (customer) {
      query.customer = (customer._id as any).toString();
    } else {
      // No customer record yet — return empty
      sendPaginated(res, { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }, 'Orders retrieved');
      return;
    }
  }

  const result = await orderService.getAll(query);
  sendPaginated(res, result, 'Orders retrieved');
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const order = await orderService.getById(getParam(req, 'id'));

  // Customers can only view their own orders
  if (user?.role === 'customer' && order) {
    const fullUser = await User.findById(user.id);
    const customer = await Customer.findOne({
      $or: [
        ...(fullUser?.email ? [{ email: fullUser.email }] : []),
        ...(fullUser?.phone ? [{ phone: fullUser.phone }] : []),
      ],
    });
    const orderCustomerId = (order as any).customer?.id?.toString() || (order as any).customer?._id?.toString() || (order as any).customer?.toString();
    if (!customer || orderCustomerId !== (customer._id as any).toString()) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
  }

  sendSuccess(res, { order }, 'Order retrieved');
});

export const getOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getByOrderNumber(getParam(req, 'orderNumber'));
  sendSuccess(res, { order }, 'Order retrieved');
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const order = await orderService.updateStatus(
    getParam(req, 'id'),
    req.body.status,
    user?.id,
    req.body.notes,
    req.body.deliveryStaff
  );
  sendSuccess(res, { order }, 'Order status updated');
});

export const updateOrderItems = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const order = await orderService.updateItems(
    getParam(req, 'id'),
    req.body.items,
    user?.id
  );
  sendSuccess(res, { order }, 'Order items updated');
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const order = await orderService.cancelOrder(
    getParam(req, 'id'),
    req.body.reason,
    user?.id
  );
  sendSuccess(res, { order }, 'Order cancelled');
});
