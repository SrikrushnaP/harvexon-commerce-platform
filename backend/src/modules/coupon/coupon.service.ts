import { Coupon, ICoupon } from './coupon.model';
import { Order } from '../order/order.model';
import { Customer } from '../customer';
import { Product } from '../catalog';
import { NotFoundError, ValidationError } from '../../common/middleware';
import { parsePagination, buildPaginationMeta } from '../../common/utils';
import { PaginationQuery } from '../../common/types';
import { APP_CONSTANTS } from '../../config';

interface CartItem {
  product: string;
  quantity: number;
  price: number;
  total: number;
  category?: string;
}

interface CouponQuery extends PaginationQuery {
  search?: string;
  type?: string;
  isActive?: boolean;
  autoApply?: boolean;
}

class CouponService {
  async create(data: any, userId?: string): Promise<ICoupon> {
    const coupon = await Coupon.create({
      ...data,
      createdBy: userId,
    });
    return coupon;
  }

  async getAll(query: CouponQuery): Promise<any> {
    const { skip, limit, sort, page } = parsePagination(query);

    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { code: { $regex: query.search, $options: 'i' } },
        { title: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.autoApply !== undefined) {
      filter.autoApply = query.autoApply;
    }

    const [data, total] = await Promise.all([
      Coupon.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('applicableCategories', 'name')
        .populate('applicableProducts', 'name')
        .populate('productCondition.product', 'name basePrice')
        .populate('buyXGetY.product', 'name basePrice'),
      Coupon.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<ICoupon> {
    const coupon = await Coupon.findById(id)
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name')
      .populate('excludedProducts', 'name')
      .populate('customerGroups', 'name type')
      .populate('specificCustomers', 'name phone')
      .populate('productCondition.product', 'name basePrice')
      .populate('buyXGetY.product', 'name basePrice');

    if (!coupon) throw new NotFoundError('Coupon');
    return coupon;
  }

  async update(id: string, data: any, userId?: string): Promise<ICoupon> {
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );

    if (!coupon) throw new NotFoundError('Coupon');
    return coupon;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new NotFoundError('Coupon');

    coupon.isActive = false;
    coupon.updatedBy = userId as any;
    await coupon.save();
  }

  async validateCoupon(
    code: string,
    customerId: string,
    cartItems: CartItem[],
    cartSubtotal: number
  ): Promise<{ valid: boolean; coupon: ICoupon; message?: string }> {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new ValidationError('Invalid coupon code');
    }

    const now = new Date();

    // Check date range
    if (now < coupon.startDate) {
      throw new ValidationError('Coupon is not yet active');
    }
    if (now > coupon.endDate) {
      throw new ValidationError('Coupon has expired');
    }

    // Check maxTotalUses
    if (coupon.maxTotalUses && coupon.currentUses >= coupon.maxTotalUses) {
      throw new ValidationError('Coupon usage limit has been reached');
    }

    // Check per-customer usage limit
    const customerUsageCount = coupon.usageHistory.filter(
      (entry) => entry.customer.toString() === customerId
    ).length;

    if (customerUsageCount >= coupon.maxUsesPerCustomer) {
      throw new ValidationError('You have already used this coupon the maximum number of times');
    }

    // Check minCartValue
    if (cartSubtotal < coupon.minCartValue) {
      throw new ValidationError(
        `Minimum cart value of ₹${coupon.minCartValue} is required to use this coupon`
      );
    }

    // For first_order: verify customer has 0 delivered orders
    if (coupon.type === APP_CONSTANTS.COUPON_TYPE.FIRST_ORDER) {
      const deliveredOrderCount = await Order.countDocuments({
        customer: customerId,
        status: APP_CONSTANTS.ORDER_STATUS.DELIVERED,
      });

      if (deliveredOrderCount > 0) {
        throw new ValidationError('This coupon is only valid for your first order');
      }
    }

    // For customerGroups: verify customer belongs to one of the groups
    if (coupon.customerGroups && coupon.customerGroups.length > 0) {
      const customer = await Customer.findById(customerId);
      if (!customer) throw new NotFoundError('Customer');

      const customerGroupId = customer.group.toString();
      const validGroups = coupon.customerGroups.map((g) => g.toString());

      if (!validGroups.includes(customerGroupId)) {
        throw new ValidationError('This coupon is not available for your customer group');
      }
    }

    // For specificCustomers: verify customer is in the list
    if (coupon.specificCustomers && coupon.specificCustomers.length > 0) {
      const validCustomers = coupon.specificCustomers.map((c) => c.toString());
      if (!validCustomers.includes(customerId)) {
        throw new ValidationError('This coupon is not available for your account');
      }
    }

    // For applicableCategories: verify cart has qualifying items
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const validCategories = coupon.applicableCategories.map((c) => c.toString());
      const cartCategories = cartItems
        .filter((item) => item.category)
        .map((item) => item.category!);

      const hasQualifyingItem = cartCategories.some((cat) => validCategories.includes(cat));
      if (!hasQualifyingItem) {
        throw new ValidationError('Your cart does not contain items from eligible categories');
      }
    }

    // For applicableProducts: verify cart has qualifying items
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const validProducts = coupon.applicableProducts.map((p) => p.toString());
      const cartProductIds = cartItems.map((item) => item.product);

      const hasQualifyingItem = cartProductIds.some((pid) => validProducts.includes(pid));
      if (!hasQualifyingItem) {
        throw new ValidationError('Your cart does not contain eligible products for this coupon');
      }
    }

    // For excludedProducts: verify cart doesn't only contain excluded items
    if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
      const excludedIds = coupon.excludedProducts.map((p) => p.toString());
      const cartProductIds = cartItems.map((item) => item.product);

      const allExcluded = cartProductIds.every((pid) => excludedIds.includes(pid));
      if (allExcluded) {
        throw new ValidationError('All items in your cart are excluded from this coupon');
      }
    }

    // For product_special_price: verify the product is in cart
    if (coupon.type === APP_CONSTANTS.COUPON_TYPE.PRODUCT_SPECIAL_PRICE && coupon.productCondition) {
      const targetProductId = coupon.productCondition.product.toString();
      const inCart = cartItems.some((item) => item.product === targetProductId);
      if (!inCart) {
        throw new ValidationError('The required product for this coupon is not in your cart');
      }
    }

    // For buy_x_get_y: verify buyQty is met in cart
    if (coupon.type === APP_CONSTANTS.COUPON_TYPE.BUY_X_GET_Y && coupon.buyXGetY) {
      const targetProductId = coupon.buyXGetY.product.toString();
      const cartItem = cartItems.find((item) => item.product === targetProductId);
      if (!cartItem || cartItem.quantity < coupon.buyXGetY.buyQty) {
        throw new ValidationError(
          `You need at least ${coupon.buyXGetY.buyQty} of the required product to use this coupon`
        );
      }
    }

    return { valid: true, coupon };
  }

  calculateDiscount(
    coupon: ICoupon,
    cartItems: CartItem[],
    cartSubtotal: number,
    deliveryCharge: number
  ): number {
    switch (coupon.type) {
      case APP_CONSTANTS.COUPON_TYPE.PERCENTAGE: {
        const discount = (cartSubtotal * (coupon.discountPercent || 0)) / 100;
        return Math.min(discount, coupon.maxDiscount || discount);
      }

      case APP_CONSTANTS.COUPON_TYPE.FLAT: {
        return Math.min(coupon.flatAmount || 0, cartSubtotal);
      }

      case APP_CONSTANTS.COUPON_TYPE.PRODUCT_SPECIAL_PRICE: {
        if (!coupon.productCondition) return 0;
        const targetProductId = coupon.productCondition.product.toString();
        const cartItem = cartItems.find((item) => item.product === targetProductId);
        if (!cartItem) return 0;

        const originalPrice = cartItem.price;
        const specialPrice = coupon.productCondition.specialPrice;
        const qty = Math.min(cartItem.quantity, coupon.productCondition.quantity);
        const discount = (originalPrice - specialPrice) * qty;
        return Math.max(0, discount);
      }

      case APP_CONSTANTS.COUPON_TYPE.BUY_X_GET_Y: {
        if (!coupon.buyXGetY) return 0;
        const targetProductId = coupon.buyXGetY.product.toString();
        const cartItem = cartItems.find((item) => item.product === targetProductId);
        if (!cartItem) return 0;

        if (cartItem.quantity < coupon.buyXGetY.buyQty) return 0;
        const freeQty = coupon.buyXGetY.getQty;
        const discount = cartItem.price * freeQty;
        return Math.max(0, discount);
      }

      case APP_CONSTANTS.COUPON_TYPE.FREE_DELIVERY: {
        return deliveryCharge;
      }

      case APP_CONSTANTS.COUPON_TYPE.FIRST_ORDER: {
        const discount = (cartSubtotal * (coupon.discountPercent || 0)) / 100;
        return Math.min(discount, coupon.maxDiscount || discount);
      }

      default:
        return 0;
    }
  }

  async applyCoupon(couponId: string, customerId: string, orderId: string): Promise<void> {
    await Coupon.findByIdAndUpdate(couponId, {
      $inc: { currentUses: 1 },
      $push: {
        usageHistory: {
          customer: customerId,
          order: orderId,
          usedAt: new Date(),
        },
      },
    });
  }

  async getAvailableCoupons(customerId: string, cartSubtotal: number): Promise<ICoupon[]> {
    const now = new Date();

    // Get active coupons within date range
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      minCartValue: { $lte: cartSubtotal },
    })
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name')
      .populate('productCondition.product', 'name basePrice')
      .populate('buyXGetY.product', 'name basePrice');

    // Filter out coupons that have exceeded total usage
    const availableCoupons: ICoupon[] = [];

    for (const coupon of coupons) {
      // Check maxTotalUses
      if (coupon.maxTotalUses && coupon.currentUses >= coupon.maxTotalUses) {
        continue;
      }

      // Check per-customer usage limit
      const customerUsageCount = coupon.usageHistory.filter(
        (entry) => entry.customer.toString() === customerId
      ).length;

      if (customerUsageCount >= coupon.maxUsesPerCustomer) {
        continue;
      }

      // For specificCustomers: verify customer is in the list
      if (coupon.specificCustomers && coupon.specificCustomers.length > 0) {
        const validCustomers = coupon.specificCustomers.map((c) => c.toString());
        if (!validCustomers.includes(customerId)) {
          continue;
        }
      }

      // For customerGroups: verify customer belongs to one of the groups
      if (coupon.customerGroups && coupon.customerGroups.length > 0) {
        const customer = await Customer.findById(customerId);
        if (customer) {
          const customerGroupId = customer.group.toString();
          const validGroups = coupon.customerGroups.map((g) => g.toString());
          if (!validGroups.includes(customerGroupId)) {
            continue;
          }
        } else {
          continue;
        }
      }

      // For first_order: check delivered orders
      if (coupon.type === APP_CONSTANTS.COUPON_TYPE.FIRST_ORDER) {
        const deliveredOrderCount = await Order.countDocuments({
          customer: customerId,
          status: APP_CONSTANTS.ORDER_STATUS.DELIVERED,
        });
        if (deliveredOrderCount > 0) {
          continue;
        }
      }

      availableCoupons.push(coupon);
    }

    return availableCoupons;
  }
}

export const couponService = new CouponService();
