import { Order, IOrder } from './order.model';
import { Customer } from '../customer';
import { Address } from '../customer';
import { Product } from '../catalog';
import { pricingService } from '../pricing';
import { Settings } from '../settings/settings.model';
import { NotFoundError, ValidationError } from '../../common/middleware';
import { parsePagination, buildPaginationMeta } from '../../common/utils';
import { PaginationQuery } from '../../common/types';
import { APP_CONSTANTS, OrderStatus } from '../../config';

// Valid status transitions map
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [APP_CONSTANTS.ORDER_STATUS.DRAFT]: [
    APP_CONSTANTS.ORDER_STATUS.CONFIRMED,
    APP_CONSTANTS.ORDER_STATUS.CANCELLED,
  ],
  [APP_CONSTANTS.ORDER_STATUS.CONFIRMED]: [
    APP_CONSTANTS.ORDER_STATUS.PROCESSING,
    APP_CONSTANTS.ORDER_STATUS.CANCELLED,
  ],
  [APP_CONSTANTS.ORDER_STATUS.PROCESSING]: [
    APP_CONSTANTS.ORDER_STATUS.PACKED,
    APP_CONSTANTS.ORDER_STATUS.CANCELLED,
  ],
  [APP_CONSTANTS.ORDER_STATUS.PACKED]: [
    APP_CONSTANTS.ORDER_STATUS.ASSIGNED,
    APP_CONSTANTS.ORDER_STATUS.CANCELLED,
  ],
  [APP_CONSTANTS.ORDER_STATUS.ASSIGNED]: [
    APP_CONSTANTS.ORDER_STATUS.OUT_FOR_DELIVERY,
    APP_CONSTANTS.ORDER_STATUS.CANCELLED,
  ],
  [APP_CONSTANTS.ORDER_STATUS.OUT_FOR_DELIVERY]: [
    APP_CONSTANTS.ORDER_STATUS.DELIVERED,
    APP_CONSTANTS.ORDER_STATUS.RETURNED,
  ],
  [APP_CONSTANTS.ORDER_STATUS.DELIVERED]: [
    APP_CONSTANTS.ORDER_STATUS.RETURNED,
  ],
  [APP_CONSTANTS.ORDER_STATUS.CANCELLED]: [],
  [APP_CONSTANTS.ORDER_STATUS.RETURNED]: [],
};

interface CreateOrderData {
  customer: string;
  deliveryAddress: any;
  items: { product: string; quantity: number }[];
  paymentMethod: 'cash' | 'cod' | 'upi' | 'bank_transfer' | 'credit';
  notes?: string;
  discount?: number;
}

interface OrderQuery extends PaginationQuery {
  customer?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

class OrderService {
  async create(data: CreateOrderData, userId?: string): Promise<IOrder> {
    // Validate customer exists
    const customer = await Customer.findById(data.customer);
    if (!customer) throw new NotFoundError('Customer');

    // Resolve delivery address
    let deliveryAddress: any;
    if ('addressId' in data.deliveryAddress) {
      const address = await Address.findById(data.deliveryAddress.addressId);
      if (!address) throw new NotFoundError('Address');
      deliveryAddress = {
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark,
        location: address.location,
      };
    } else {
      deliveryAddress = data.deliveryAddress;
    }

    // Resolve items with pricing
    const resolvedItems = [];
    for (const item of data.items) {
      const product = await Product.findById(item.product).populate('unit', 'shortName');
      if (!product) throw new NotFoundError(`Product (${item.product})`);

      const resolved = await pricingService.getProductPrice(
        item.product,
        data.customer,
        item.quantity
      );

      const total = resolved.price * item.quantity;
      resolvedItems.push({
        product: product._id,
        name: product.name,
        unit: (product.unit as any)?.shortName || 'pc',
        quantity: item.quantity,
        price: resolved.price,
        total,
      });
    }

    // Calculate subtotal
    const subtotal = resolvedItems.reduce((sum, item) => sum + item.total, 0);

    // Determine delivery charge from settings
    const settings = await Settings.findOne();
    let deliveryCharge = settings?.orderSettings?.deliveryCharge || 0;
    const freeDeliveryAbove = settings?.orderSettings?.freeDeliveryAbove || 0;
    if (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) {
      deliveryCharge = 0;
    }

    // Apply discount
    const discount = data.discount || 0;

    // Calculate total
    const total = subtotal + deliveryCharge - discount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: data.customer,
      deliveryAddress,
      items: resolvedItems,
      status: APP_CONSTANTS.ORDER_STATUS.DRAFT,
      subtotal,
      deliveryCharge,
      discount,
      total,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
      paidAmount: 0,
      notes: data.notes,
      orderDate: new Date(),
      statusHistory: [
        {
          status: APP_CONSTANTS.ORDER_STATUS.DRAFT,
          timestamp: new Date(),
          changedBy: userId,
          notes: 'Order created',
        },
      ],
      createdBy: userId,
    });

    return order.populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'items.product', select: 'name sku images' },
    ]);
  }

  async getAll(query: OrderQuery): Promise<any> {
    const { skip, limit, sort, page } = parsePagination(query);

    const filter: any = {};
    if (query.customer) filter.customer = query.customer;
    if (query.status) filter.status = query.status;
    if (query.dateFrom || query.dateTo) {
      filter.orderDate = {};
      if (query.dateFrom) filter.orderDate.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.orderDate.$lte = new Date(query.dateTo);
    }
    if (query.search) {
      filter.$or = [
        { orderNumber: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('customer', 'name phone email'),
      Order.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<IOrder> {
    const order = await Order.findById(id)
      .populate('customer', 'name phone email businessName')
      .populate('items.product', 'name sku images');
    if (!order) throw new NotFoundError('Order');
    return order;
  }

  async getByOrderNumber(orderNumber: string): Promise<IOrder> {
    const order = await Order.findOne({ orderNumber })
      .populate('customer', 'name phone email businessName')
      .populate('items.product', 'name sku images');
    if (!order) throw new NotFoundError('Order');
    return order;
  }

  async updateStatus(
    id: string,
    newStatus: OrderStatus,
    userId?: string,
    notes?: string
  ): Promise<IOrder> {
    const order = await Order.findById(id);
    if (!order) throw new NotFoundError('Order');

    const currentStatus = order.status as OrderStatus;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions.join(', ') || 'none (terminal state)'}`
      );
    }

    // If cancelling, require cancellation reason
    if (newStatus === APP_CONSTANTS.ORDER_STATUS.CANCELLED && !notes) {
      throw new ValidationError('Cancellation reason is required');
    }

    // Update status and timestamps
    order.status = newStatus;

    const now = new Date();
    switch (newStatus) {
      case APP_CONSTANTS.ORDER_STATUS.CONFIRMED:
        order.confirmedAt = now;
        break;
      case APP_CONSTANTS.ORDER_STATUS.PACKED:
        order.packedAt = now;
        break;
      case APP_CONSTANTS.ORDER_STATUS.DELIVERED:
        order.deliveredAt = now;
        break;
      case APP_CONSTANTS.ORDER_STATUS.CANCELLED:
        order.cancelledAt = now;
        order.cancellationReason = notes;
        break;
    }

    // Push to status history
    order.statusHistory.push({
      status: newStatus,
      timestamp: now,
      changedBy: userId as any,
      notes,
    });

    order.updatedBy = userId as any;
    await order.save();

    // If delivered, update customer stats
    if (newStatus === APP_CONSTANTS.ORDER_STATUS.DELIVERED) {
      await Customer.findByIdAndUpdate(order.customer, {
        $inc: { totalOrders: 1, totalSpent: order.total },
        $set: { lastOrderDate: now },
      });
    }

    return order.populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'items.product', select: 'name sku images' },
    ]);
  }

  async updateItems(
    id: string,
    items: { product: string; quantity: number }[],
    userId?: string
  ): Promise<IOrder> {
    const order = await Order.findById(id);
    if (!order) throw new NotFoundError('Order');

    // Only allow updating items for draft orders
    if (order.status !== APP_CONSTANTS.ORDER_STATUS.DRAFT) {
      throw new ValidationError('Can only update items for orders in draft status');
    }

    // Resolve items with pricing
    const resolvedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product).populate('unit', 'shortName');
      if (!product) throw new NotFoundError(`Product (${item.product})`);

      const resolved = await pricingService.getProductPrice(
        item.product,
        order.customer.toString(),
        item.quantity
      );

      const total = resolved.price * item.quantity;
      resolvedItems.push({
        product: product._id,
        name: product.name,
        unit: (product.unit as any)?.shortName || 'pc',
        quantity: item.quantity,
        price: resolved.price,
        total,
      });
    }

    // Recalculate totals
    const subtotal = resolvedItems.reduce((sum, item) => sum + item.total, 0);

    // Re-evaluate delivery charge
    const settings = await Settings.findOne();
    let deliveryCharge = settings?.orderSettings?.deliveryCharge || 0;
    const freeDeliveryAbove = settings?.orderSettings?.freeDeliveryAbove || 0;
    if (freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove) {
      deliveryCharge = 0;
    }

    const total = subtotal + deliveryCharge - order.discount;

    order.items = resolvedItems as any;
    order.subtotal = subtotal;
    order.deliveryCharge = deliveryCharge;
    order.total = total;
    order.updatedBy = userId as any;

    await order.save();

    return order.populate([
      { path: 'customer', select: 'name phone email' },
      { path: 'items.product', select: 'name sku images' },
    ]);
  }

  async cancelOrder(id: string, reason: string, userId?: string): Promise<IOrder> {
    return this.updateStatus(id, APP_CONSTANTS.ORDER_STATUS.CANCELLED, userId, reason);
  }

  // --- Private helpers ---

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Count orders created today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const todayCount = await Order.countDocuments({
      orderDate: { $gte: startOfDay, $lt: endOfDay },
    });

    const sequence = String(todayCount + 1).padStart(5, '0');
    return `HCP-${dateStr}-${sequence}`;
  }
}

export const orderService = new OrderService();
