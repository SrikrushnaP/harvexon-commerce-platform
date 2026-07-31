import { Supplier, ISupplier } from './supplier.model';
import { Purchase, IPurchase, PurchaseStatus } from './purchase.model';
import { Product } from '../catalog';
import { inventoryService } from '../inventory';
import { NotFoundError, ConflictError, ValidationError } from '../../common/middleware';
import { parsePagination, buildPaginationMeta } from '../../common/utils';
import { PaginationQuery } from '../../common/types';

// Valid status transitions
const STATUS_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  draft: ['ordered', 'cancelled'],
  ordered: ['partial', 'received', 'cancelled'],
  partial: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

// ----- Supplier types -----
interface SupplierQuery extends PaginationQuery {
  search?: string;
}

// ----- Purchase types -----
interface PurchaseItemInput {
  product: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
}

interface CreatePurchaseData {
  supplier: string;
  items: PurchaseItemInput[];
  tax?: number;
  shippingCost?: number;
  discount?: number;
  notes?: string;
  expectedDeliveryDate?: string;
}

interface PurchaseQuery extends PaginationQuery {
  supplier?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ----- Helper -----
function generatePurchaseNumber(): string {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(10000 + Math.random() * 90000));
  return `PO-${dateStr}-${random}`;
}

// =====================
// Supplier Service
// =====================

class SupplierService {
  async create(data: Partial<ISupplier>, userId?: string): Promise<ISupplier> {
    // Check name uniqueness
    const existing = await Supplier.findOne({ name: data.name });
    if (existing) {
      throw new ConflictError('Supplier with this name already exists');
    }

    const supplier = await Supplier.create({
      ...data,
      createdBy: userId,
    });

    return supplier;
  }

  async getAll(query: SupplierQuery) {
    const { skip, limit, page, sort } = parsePagination(query);

    const filter: any = {};
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [{ name: searchRegex }, { phone: searchRegex }];
    }

    const [data, total] = await Promise.all([
      Supplier.find(filter).sort(sort).skip(skip).limit(limit),
      Supplier.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<ISupplier> {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new NotFoundError('Supplier');
    return supplier;
  }

  async update(id: string, data: Partial<ISupplier>, userId?: string): Promise<ISupplier> {
    // If name is being changed, check uniqueness
    if (data.name) {
      const existing = await Supplier.findOne({ name: data.name, _id: { $ne: id } });
      if (existing) {
        throw new ConflictError('Supplier with this name already exists');
      }
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );

    if (!supplier) throw new NotFoundError('Supplier');
    return supplier;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new NotFoundError('Supplier');

    // Check no active purchases
    const activePurchases = await Purchase.countDocuments({
      supplier: id,
      status: { $in: ['draft', 'ordered', 'partial'] },
    });

    if (activePurchases > 0) {
      throw new ValidationError(
        'Cannot delete supplier with active purchases'
      );
    }

    await (supplier as any).softDelete(userId);
  }
}

// =====================
// Purchase Service
// =====================

class PurchaseService {
  async create(data: CreatePurchaseData, userId?: string): Promise<IPurchase> {
    // Validate supplier exists
    const supplier = await Supplier.findById(data.supplier);
    if (!supplier) throw new NotFoundError('Supplier');

    // Validate all products exist and build items with snapshots
    const items = [];
    for (const item of data.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new NotFoundError(`Product (${item.product})`);
      }

      const total = item.quantity * item.unitCost;
      items.push({
        product: item.product,
        name: product.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = data.tax || 0;
    const shippingCost = data.shippingCost || 0;
    const discount = data.discount || 0;
    const total = subtotal + tax + shippingCost - discount;

    // Generate purchase number
    const purchaseNumber = generatePurchaseNumber();

    const purchase = await Purchase.create({
      purchaseNumber,
      supplier: data.supplier,
      items,
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      notes: data.notes,
      expectedDeliveryDate: data.expectedDeliveryDate
        ? new Date(data.expectedDeliveryDate)
        : undefined,
      createdBy: userId,
    });

    return purchase.populate([
      { path: 'supplier', select: 'name phone' },
      { path: 'items.product', select: 'name sku' },
    ]);
  }

  async getAll(query: PurchaseQuery) {
    const { skip, limit, page, sort } = parsePagination(query);

    const filter: any = {};
    if (query.supplier) filter.supplier = query.supplier;
    if (query.status) filter.status = query.status;
    if (query.dateFrom || query.dateTo) {
      filter.purchaseDate = {};
      if (query.dateFrom) filter.purchaseDate.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.purchaseDate.$lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      Purchase.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('supplier', 'name phone'),
      Purchase.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<IPurchase> {
    const purchase = await Purchase.findById(id)
      .populate('supplier', 'name phone email contactPerson')
      .populate('items.product', 'name sku');

    if (!purchase) throw new NotFoundError('Purchase');
    return purchase;
  }

  async updateStatus(
    id: string,
    newStatus: PurchaseStatus,
    userId?: string
  ): Promise<IPurchase> {
    const purchase = await Purchase.findById(id);
    if (!purchase) throw new NotFoundError('Purchase');

    const currentStatus = purchase.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from '${currentStatus}' to '${newStatus}'`
      );
    }

    purchase.status = newStatus;
    if (userId) purchase.updatedBy = userId as any;

    // If received, process inventory and supplier stats
    if (newStatus === 'received') {
      purchase.receivedDate = new Date();

      // Create inventory transactions for each item
      for (const item of purchase.items) {
        await inventoryService.addTransaction(
          {
            product: item.product.toString(),
            type: 'purchase',
            quantity: item.quantity,
            direction: 'in',
            referenceType: 'purchase',
            referenceId: (purchase._id as string).toString(),
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate
              ? item.expiryDate.toISOString()
              : undefined,
            unitCost: item.unitCost,
            notes: `Purchase ${purchase.purchaseNumber}`,
          },
          userId
        );
      }

      // Update supplier stats
      await Supplier.findByIdAndUpdate(purchase.supplier, {
        $inc: { totalPurchases: 1, totalSpent: purchase.total },
      });
    }

    await purchase.save();

    return purchase.populate([
      { path: 'supplier', select: 'name phone' },
      { path: 'items.product', select: 'name sku' },
    ]);
  }

  async updateItems(
    id: string,
    items: PurchaseItemInput[],
    userId?: string
  ): Promise<IPurchase> {
    const purchase = await Purchase.findById(id);
    if (!purchase) throw new NotFoundError('Purchase');

    if (purchase.status !== 'draft') {
      throw new ValidationError('Can only update items on draft purchases');
    }

    // Validate all products exist and build items
    const updatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new NotFoundError(`Product (${item.product})`);
      }

      const total = item.quantity * item.unitCost;
      updatedItems.push({
        product: item.product,
        name: product.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      });
    }

    // Recalculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + purchase.tax + purchase.shippingCost - purchase.discount;

    purchase.items = updatedItems as any;
    purchase.subtotal = subtotal;
    purchase.total = total;
    if (userId) purchase.updatedBy = userId as any;

    await purchase.save();

    return purchase.populate([
      { path: 'supplier', select: 'name phone' },
      { path: 'items.product', select: 'name sku' },
    ]);
  }

  async cancelPurchase(id: string, userId?: string): Promise<IPurchase> {
    return this.updateStatus(id, 'cancelled', userId);
  }
}

export const supplierService = new SupplierService();
export const purchaseService = new PurchaseService();
