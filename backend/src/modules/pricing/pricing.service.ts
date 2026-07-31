import { PriceRule, IPriceRule } from './price-rule.model';
import { Product } from '../catalog/product.model';
import { Customer } from '../customer/customer.model';
import { CustomerGroup } from '../customer/customer-group.model';
import { NotFoundError, ConflictError } from '../../common/middleware';
import { parsePagination, buildPaginationMeta } from '../../common/utils';
import { PaginationQuery } from '../../common/types';
import { APP_CONSTANTS } from '../../config';

export interface ResolvedPrice {
  price: number;
  type: string;
  rule?: IPriceRule;
}

class PricingService {
  async create(data: Partial<IPriceRule>, userId?: string): Promise<IPriceRule> {
    // Validate product exists
    const product = await Product.findById(data.product);
    if (!product) throw new NotFoundError('Product');

    // Validate group exists if provided
    if (data.group) {
      const group = await CustomerGroup.findById(data.group);
      if (!group) throw new NotFoundError('Customer group');
    }

    // Validate customer exists if provided
    if (data.customer) {
      const customer = await Customer.findById(data.customer);
      if (!customer) throw new NotFoundError('Customer');
    }

    // Check for conflicts
    if (data.type === APP_CONSTANTS.PRICING_TYPE.GROUP && data.group) {
      const existing = await PriceRule.findOne({
        product: data.product,
        group: data.group,
        type: APP_CONSTANTS.PRICING_TYPE.GROUP,
      });
      if (existing) {
        throw new ConflictError('A group price rule already exists for this product and group');
      }
    }

    if (data.type === APP_CONSTANTS.PRICING_TYPE.CUSTOMER && data.customer) {
      const existing = await PriceRule.findOne({
        product: data.product,
        customer: data.customer,
        type: APP_CONSTANTS.PRICING_TYPE.CUSTOMER,
      });
      if (existing) {
        throw new ConflictError('A customer price rule already exists for this product and customer');
      }
    }

    const rule = await PriceRule.create({ ...data, createdBy: userId });
    return rule.populate([
      { path: 'product', select: 'name sku basePrice' },
      { path: 'group', select: 'name type' },
      { path: 'customer', select: 'name phone' },
    ]);
  }

  async getAll(
    query: PaginationQuery & { product?: string; type?: string; group?: string; customer?: string }
  ): Promise<any> {
    const { skip, limit, sort, page } = parsePagination(query);

    const filter: any = {};
    if (query.product) filter.product = query.product;
    if (query.type) filter.type = query.type;
    if (query.group) filter.group = query.group;
    if (query.customer) filter.customer = query.customer;

    const [data, total] = await Promise.all([
      PriceRule.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('product', 'name sku basePrice')
        .populate('group', 'name type')
        .populate('customer', 'name phone'),
      PriceRule.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<IPriceRule> {
    const rule = await PriceRule.findById(id)
      .populate('product', 'name sku basePrice')
      .populate('group', 'name type')
      .populate('customer', 'name phone');
    if (!rule) throw new NotFoundError('Price rule');
    return rule;
  }

  async update(id: string, data: Partial<IPriceRule>, userId?: string): Promise<IPriceRule> {
    // Validate group exists if provided
    if (data.group) {
      const group = await CustomerGroup.findById(data.group);
      if (!group) throw new NotFoundError('Customer group');
    }

    // Validate customer exists if provided
    if (data.customer) {
      const customer = await Customer.findById(data.customer);
      if (!customer) throw new NotFoundError('Customer');
    }

    const rule = await PriceRule.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    )
      .populate('product', 'name sku basePrice')
      .populate('group', 'name type')
      .populate('customer', 'name phone');

    if (!rule) throw new NotFoundError('Price rule');
    return rule;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const rule = await PriceRule.findById(id);
    if (!rule) throw new NotFoundError('Price rule');
    await (rule as any).softDelete(userId);
  }

  /**
   * Resolves the final price for a product given context.
   * Priority: customer-specific > quantity slab > group pricing > base price
   */
  async getProductPrice(
    productId: string,
    customerId?: string,
    quantity?: number
  ): Promise<ResolvedPrice> {
    const now = new Date();

    // Build date filter for time-bound pricing
    const dateFilter = {
      $or: [
        { startDate: { $exists: false }, endDate: { $exists: false } },
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
      ],
    };

    // 1. Customer-specific price (highest priority)
    if (customerId) {
      const customerRule = await PriceRule.findOne({
        product: productId,
        customer: customerId,
        type: APP_CONSTANTS.PRICING_TYPE.CUSTOMER,
        ...dateFilter,
      }).sort({ priority: -1 });

      if (customerRule) {
        return { price: customerRule.price, type: APP_CONSTANTS.PRICING_TYPE.CUSTOMER, rule: customerRule };
      }
    }

    // 2. Quantity slab pricing
    if (quantity && quantity > 1) {
      const slabRule = await PriceRule.findOne({
        product: productId,
        type: APP_CONSTANTS.PRICING_TYPE.QUANTITY_SLAB,
        minQuantity: { $lte: quantity },
        $and: [
          {
            $or: [
              { maxQuantity: { $gte: quantity } },
              { maxQuantity: null },
              { maxQuantity: { $exists: false } },
            ],
          },
          dateFilter,
        ],
      }).sort({ minQuantity: -1, priority: -1 });

      if (slabRule) {
        return { price: slabRule.price, type: APP_CONSTANTS.PRICING_TYPE.QUANTITY_SLAB, rule: slabRule };
      }
    }

    // 3. Group pricing (look up customer's group)
    if (customerId) {
      const customer = await Customer.findById(customerId).select('group');
      if (customer?.group) {
        const groupRule = await PriceRule.findOne({
          product: productId,
          group: customer.group,
          type: APP_CONSTANTS.PRICING_TYPE.GROUP,
          ...dateFilter,
        }).sort({ priority: -1 });

        if (groupRule) {
          return { price: groupRule.price, type: APP_CONSTANTS.PRICING_TYPE.GROUP, rule: groupRule };
        }
      }
    }

    // 4. Base price fallback (from Product model)
    const product = await Product.findById(productId).select('basePrice');
    if (!product) throw new NotFoundError('Product');

    return { price: product.basePrice, type: APP_CONSTANTS.PRICING_TYPE.BASE };
  }

  /**
   * Resolves prices for multiple products at once (for cart/catalog views).
   */
  async getBulkPrices(
    productIds: string[],
    customerId?: string,
    quantity?: number
  ): Promise<Map<string, ResolvedPrice>> {
    const results = new Map<string, ResolvedPrice>();

    // Process in parallel
    const promises = productIds.map(async (productId) => {
      const resolved = await this.getProductPrice(productId, customerId, quantity);
      results.set(productId, resolved);
    });

    await Promise.all(promises);
    return results;
  }
}

export const pricingService = new PricingService();
