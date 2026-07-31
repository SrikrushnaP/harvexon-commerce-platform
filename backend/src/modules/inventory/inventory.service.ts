import { Types } from 'mongoose';
import { InventoryTransaction, IInventoryTransaction } from './inventory-transaction.model';
import { Product } from '../catalog';
import { NotFoundError, ValidationError } from '../../common/middleware';
import { parsePagination, buildPaginationMeta } from '../../common/utils';
import { PaginationQuery } from '../../common/types';
import { InventoryTransactionType } from '../../config';

interface AddTransactionData {
  product: string;
  type: InventoryTransactionType;
  quantity: number;
  direction: 'in' | 'out';
  referenceType?: string;
  referenceId?: string;
  batchNumber?: string;
  expiryDate?: string;
  unitCost?: number;
  notes?: string;
}

interface TransactionQuery extends PaginationQuery {
  product?: string;
  type?: string;
  direction?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface StockResult {
  productId: string;
  stock: number;
  lastUpdated: Date | null;
}

class InventoryService {
  async addTransaction(data: AddTransactionData, userId?: string): Promise<IInventoryTransaction> {
    // Validate product exists
    const product = await Product.findById(data.product);
    if (!product) throw new NotFoundError('Product');

    // If direction is 'out', check current stock is sufficient
    if (data.direction === 'out') {
      const stockResult = await this.getProductStock(data.product);
      if (stockResult.stock < data.quantity) {
        throw new ValidationError(
          `Insufficient stock. Available: ${stockResult.stock}, Requested: ${data.quantity}`
        );
      }
    }

    const transaction = await InventoryTransaction.create({
      product: data.product,
      type: data.type,
      quantity: data.quantity,
      direction: data.direction,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      unitCost: data.unitCost,
      notes: data.notes,
      transactionDate: new Date(),
      createdBy: userId,
    });

    return transaction.populate('product', 'name sku');
  }

  async getTransactions(query: TransactionQuery): Promise<any> {
    const { skip, limit, page } = parsePagination(query);

    const filter: any = {};
    if (query.product) filter.product = query.product;
    if (query.type) filter.type = query.type;
    if (query.direction) filter.direction = query.direction;
    if (query.dateFrom || query.dateTo) {
      filter.transactionDate = {};
      if (query.dateFrom) filter.transactionDate.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.transactionDate.$lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      InventoryTransaction.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('product', 'name sku'),
      InventoryTransaction.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getProductStock(productId: string): Promise<StockResult> {
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError('Product');

    const result = await InventoryTransaction.aggregate([
      {
        $match: {
          product: new Types.ObjectId(productId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$product',
          stockIn: {
            $sum: { $cond: [{ $eq: ['$direction', 'in'] }, '$quantity', 0] },
          },
          stockOut: {
            $sum: { $cond: [{ $eq: ['$direction', 'out'] }, '$quantity', 0] },
          },
          lastUpdated: { $max: '$transactionDate' },
        },
      },
      {
        $project: {
          stock: { $subtract: ['$stockIn', '$stockOut'] },
          lastUpdated: 1,
        },
      },
    ]);

    if (result.length === 0) {
      return { productId, stock: 0, lastUpdated: null };
    }

    return {
      productId,
      stock: result[0].stock,
      lastUpdated: result[0].lastUpdated,
    };
  }

  async getBulkStock(productIds: string[]): Promise<StockResult[]> {
    const objectIds = productIds.map((id) => new Types.ObjectId(id));

    const results = await InventoryTransaction.aggregate([
      {
        $match: {
          product: { $in: objectIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$product',
          stockIn: {
            $sum: { $cond: [{ $eq: ['$direction', 'in'] }, '$quantity', 0] },
          },
          stockOut: {
            $sum: { $cond: [{ $eq: ['$direction', 'out'] }, '$quantity', 0] },
          },
          lastUpdated: { $max: '$transactionDate' },
        },
      },
      {
        $project: {
          stock: { $subtract: ['$stockIn', '$stockOut'] },
          lastUpdated: 1,
        },
      },
    ]);

    // Map results and include products with zero stock
    const stockMap = new Map(
      results.map((r) => [r._id.toString(), { stock: r.stock, lastUpdated: r.lastUpdated }])
    );

    return productIds.map((id) => ({
      productId: id,
      stock: stockMap.get(id)?.stock || 0,
      lastUpdated: stockMap.get(id)?.lastUpdated || null,
    }));
  }

  async getStockReport(query: PaginationQuery & { lowStock?: boolean }): Promise<any> {
    const { skip, limit, page } = parsePagination(query);

    // Get all products that track inventory
    const productFilter: any = { trackInventory: true };
    const products = await Product.find(productFilter)
      .select('name sku lowStockThreshold category brand')
      .populate('category', 'name')
      .populate('brand', 'name')
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(productFilter);

    if (products.length === 0) {
      return { data: [], pagination: buildPaginationMeta(page, limit, totalProducts) };
    }

    const productIds = products.map((p: any) => p._id);

    // Get stock levels for all products
    const stockResults = await InventoryTransaction.aggregate([
      {
        $match: {
          product: { $in: productIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$product',
          stockIn: {
            $sum: { $cond: [{ $eq: ['$direction', 'in'] }, '$quantity', 0] },
          },
          stockOut: {
            $sum: { $cond: [{ $eq: ['$direction', 'out'] }, '$quantity', 0] },
          },
          lastTransaction: { $max: '$transactionDate' },
        },
      },
      {
        $project: {
          stock: { $subtract: ['$stockIn', '$stockOut'] },
          lastTransaction: 1,
        },
      },
    ]);

    const stockMap = new Map(
      stockResults.map((r) => [
        r._id.toString(),
        { stock: r.stock, lastTransaction: r.lastTransaction },
      ])
    );

    let report = products.map((product: any) => {
      const stockData = stockMap.get(product._id.toString());
      return {
        product,
        stock: stockData?.stock || 0,
        lastTransaction: stockData?.lastTransaction || null,
      };
    });

    // Filter low stock if requested
    if (query.lowStock) {
      report = report.filter(
        (item) => item.stock <= (item.product.lowStockThreshold || 0)
      );
    }

    return {
      data: report,
      pagination: buildPaginationMeta(page, limit, query.lowStock ? report.length : totalProducts),
    };
  }

  async getTransactionsByRef(
    referenceType: string,
    referenceId: string
  ): Promise<IInventoryTransaction[]> {
    return InventoryTransaction.find({ referenceType, referenceId })
      .sort({ transactionDate: -1 })
      .populate('product', 'name sku');
  }

  async adjustStock(
    productId: string,
    quantity: number,
    direction: 'in' | 'out',
    notes: string,
    userId?: string
  ): Promise<IInventoryTransaction> {
    return this.addTransaction(
      {
        product: productId,
        type: 'adjustment',
        quantity,
        direction,
        referenceType: 'manual',
        notes,
      },
      userId
    );
  }
}

export const inventoryService = new InventoryService();
