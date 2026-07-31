import { CustomerGroup, ICustomerGroup } from './customer-group.model';
import { Customer, ICustomer } from './customer.model';
import { Address, IAddress } from './address.model';
import { NotFoundError, ConflictError } from '../../common/middleware';
import { parsePagination, buildPaginationMeta } from '../../common/utils';
import { PaginationQuery } from '../../common/types';

// ==================== CUSTOMER GROUP SERVICE ====================

class CustomerGroupService {
  async create(data: Partial<ICustomerGroup>, userId?: string): Promise<ICustomerGroup> {
    const existing = await CustomerGroup.findOne({ name: data.name });
    if (existing) {
      throw new ConflictError('Customer group with this name already exists');
    }

    return CustomerGroup.create({ ...data, createdBy: userId });
  }

  async getAll(): Promise<ICustomerGroup[]> {
    return CustomerGroup.find().sort({ name: 1 });
  }

  async getById(id: string): Promise<ICustomerGroup> {
    const group = await CustomerGroup.findById(id);
    if (!group) throw new NotFoundError('Customer group');
    return group;
  }

  async update(id: string, data: Partial<ICustomerGroup>, userId?: string): Promise<ICustomerGroup> {
    if (data.name) {
      const existing = await CustomerGroup.findOne({ name: data.name, _id: { $ne: id } });
      if (existing) throw new ConflictError('Customer group with this name already exists');
    }

    const group = await CustomerGroup.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!group) throw new NotFoundError('Customer group');
    return group;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const group = await CustomerGroup.findById(id);
    if (!group) throw new NotFoundError('Customer group');

    // Check for customers referencing this group
    const customers = await Customer.countDocuments({ group: id });
    if (customers > 0) {
      throw new ConflictError('Cannot delete group with existing customers. Reassign customers first.');
    }

    await (group as any).softDelete(userId);
  }
}

// ==================== CUSTOMER SERVICE ====================

class CustomerService {
  async create(data: Partial<ICustomer>, userId?: string): Promise<ICustomer> {
    // Validate phone uniqueness
    const existingPhone = await Customer.findOne({ phone: data.phone });
    if (existingPhone) {
      throw new ConflictError('Customer with this phone number already exists');
    }

    // Validate group exists
    const group = await CustomerGroup.findById(data.group);
    if (!group) throw new NotFoundError('Customer group');

    const customer = await Customer.create({ ...data, createdBy: userId });
    return customer.populate('group', 'name type discountPercent');
  }

  async getAll(query: PaginationQuery & { group?: string; search?: string }): Promise<any> {
    const { skip, limit, sort, page } = parsePagination(query);

    const filter: any = {};
    if (query.group) filter.group = query.group;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Customer.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('group', 'name type discountPercent'),
      Customer.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<ICustomer> {
    const customer = await Customer.findById(id)
      .populate('group', 'name type discountPercent');
    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }

  async update(id: string, data: Partial<ICustomer>, userId?: string): Promise<ICustomer> {
    if (data.phone) {
      const existing = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
      if (existing) throw new ConflictError('Customer with this phone number already exists');
    }

    if (data.group) {
      const group = await CustomerGroup.findById(data.group);
      if (!group) throw new NotFoundError('Customer group');
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    ).populate('group', 'name type discountPercent');

    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const customer = await Customer.findById(id);
    if (!customer) throw new NotFoundError('Customer');
    await (customer as any).softDelete(userId);
  }
}

// ==================== ADDRESS SERVICE ====================

class AddressService {
  async create(data: Partial<IAddress>, userId?: string): Promise<IAddress> {
    // Validate customer exists
    const customer = await Customer.findById(data.customer);
    if (!customer) throw new NotFoundError('Customer');

    // If setting as default, unset others
    if (data.isDefault) {
      await Address.updateMany(
        { customer: data.customer },
        { isDefault: false }
      );
    }

    return Address.create({ ...data, createdBy: userId });
  }

  async getAll(query: { customer?: string }): Promise<IAddress[]> {
    const filter: any = {};
    if (query.customer) filter.customer = query.customer;

    return Address.find(filter).sort({ isDefault: -1, createdAt: -1 });
  }

  async getById(id: string): Promise<IAddress> {
    const address = await Address.findById(id);
    if (!address) throw new NotFoundError('Address');
    return address;
  }

  async update(id: string, data: Partial<IAddress>, userId?: string): Promise<IAddress> {
    const address = await Address.findById(id);
    if (!address) throw new NotFoundError('Address');

    // If setting as default, unset others
    if (data.isDefault) {
      await Address.updateMany(
        { customer: address.customer, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const updated = await Address.findByIdAndUpdate(
      id,
      { ...data, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!updated) throw new NotFoundError('Address');
    return updated;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const address = await Address.findById(id);
    if (!address) throw new NotFoundError('Address');

    const wasDefault = address.isDefault;
    const customerId = address.customer;

    await (address as any).softDelete(userId);

    // If deleted address was default, set another as default if exists
    if (wasDefault) {
      const another = await Address.findOne({ customer: customerId }).sort({ createdAt: -1 });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }
  }
}

// Export service instances
export const customerGroupService = new CustomerGroupService();
export const customerService = new CustomerService();
export const addressService = new AddressService();
