import { DeliveryStaff, IDeliveryStaff } from './delivery-staff.model';
import { DeliveryAssignment, IDeliveryAssignment } from './delivery-assignment.model';
import { Order, orderService } from '../order';
import { NotFoundError, ValidationError, ConflictError } from '../../common/middleware';
import { parsePagination, buildPaginationMeta } from '../../common/utils';
import { PaginationQuery } from '../../common/types';
import { APP_CONSTANTS, DeliveryStatus } from '../../config';

// Valid delivery status transitions
const VALID_DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [APP_CONSTANTS.DELIVERY_STATUS.PENDING]: [APP_CONSTANTS.DELIVERY_STATUS.ASSIGNED],
  [APP_CONSTANTS.DELIVERY_STATUS.ASSIGNED]: [
    APP_CONSTANTS.DELIVERY_STATUS.PICKED_UP,
    APP_CONSTANTS.DELIVERY_STATUS.FAILED,
  ],
  [APP_CONSTANTS.DELIVERY_STATUS.PICKED_UP]: [
    APP_CONSTANTS.DELIVERY_STATUS.IN_TRANSIT,
    APP_CONSTANTS.DELIVERY_STATUS.FAILED,
  ],
  [APP_CONSTANTS.DELIVERY_STATUS.IN_TRANSIT]: [
    APP_CONSTANTS.DELIVERY_STATUS.DELIVERED,
    APP_CONSTANTS.DELIVERY_STATUS.FAILED,
  ],
  [APP_CONSTANTS.DELIVERY_STATUS.DELIVERED]: [],
  [APP_CONSTANTS.DELIVERY_STATUS.FAILED]: [APP_CONSTANTS.DELIVERY_STATUS.PENDING],
};

// ===== Delivery Staff Service =====

interface CreateStaffData {
  user?: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  notes?: string;
}

interface UpdateStaffData {
  user?: string;
  name?: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  isAvailable?: boolean;
  notes?: string;
}

interface StaffQuery extends PaginationQuery {
  isAvailable?: boolean;
}

class DeliveryStaffService {
  async create(data: CreateStaffData, userId?: string): Promise<IDeliveryStaff> {
    // Check for duplicate phone
    const existing = await DeliveryStaff.findOne({ phone: data.phone, isActive: true });
    if (existing) {
      throw new ConflictError('Delivery staff with this phone already exists');
    }

    const staff = await DeliveryStaff.create({
      ...data,
      createdBy: userId,
    });

    return staff;
  }

  async getAll(query: StaffQuery) {
    const { skip, limit, page } = parsePagination(query);

    const filter: any = { isActive: true };
    if (query.isAvailable !== undefined) {
      filter.isAvailable = query.isAvailable;
    }

    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      DeliveryStaff.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryStaff.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string): Promise<IDeliveryStaff> {
    const staff = await DeliveryStaff.findOne({ _id: id, isActive: true });
    if (!staff) throw new NotFoundError('Delivery staff');
    return staff;
  }

  async update(id: string, data: UpdateStaffData, userId?: string): Promise<IDeliveryStaff> {
    const staff = await DeliveryStaff.findOne({ _id: id, isActive: true });
    if (!staff) throw new NotFoundError('Delivery staff');

    // Check phone uniqueness if changing phone
    if (data.phone && data.phone !== staff.phone) {
      const existing = await DeliveryStaff.findOne({
        phone: data.phone,
        isActive: true,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictError('Delivery staff with this phone already exists');
      }
    }

    Object.assign(staff, data);
    staff.updatedBy = userId as any;
    await staff.save();

    return staff;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const staff = await DeliveryStaff.findOne({ _id: id, isActive: true });
    if (!staff) throw new NotFoundError('Delivery staff');
    await (staff as any).softDelete(userId);
  }

  async toggleAvailability(id: string, userId?: string): Promise<IDeliveryStaff> {
    const staff = await DeliveryStaff.findOne({ _id: id, isActive: true });
    if (!staff) throw new NotFoundError('Delivery staff');

    staff.isAvailable = !staff.isAvailable;
    staff.updatedBy = userId as any;
    await staff.save();

    return staff;
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<IDeliveryStaff> {
    const staff = await DeliveryStaff.findOne({ _id: id, isActive: true });
    if (!staff) throw new NotFoundError('Delivery staff');

    staff.currentLocation = { lat, lng, updatedAt: new Date() };
    await staff.save();

    return staff;
  }
}

// ===== Delivery Assignment Service =====

interface CreateAssignmentData {
  order: string;
  deliveryStaff: string;
  notes?: string;
  distance?: number;
  estimatedTime?: number;
}

interface AssignmentQuery extends PaginationQuery {
  deliveryStaff?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UpdateStatusData {
  failureReason?: string;
  proofOfDelivery?: string;
  notes?: string;
}

class DeliveryAssignmentService {
  async create(data: CreateAssignmentData, userId?: string): Promise<IDeliveryAssignment> {
    // Validate order exists and is in correct status
    const order = await Order.findById(data.order);
    if (!order) throw new NotFoundError('Order');

    const validOrderStatuses = [
      APP_CONSTANTS.ORDER_STATUS.PACKED,
      APP_CONSTANTS.ORDER_STATUS.ASSIGNED,
    ];
    if (!validOrderStatuses.includes(order.status as any)) {
      throw new ValidationError(
        `Order must be in 'packed' or 'assigned' status. Current status: '${order.status}'`
      );
    }

    // Validate delivery staff exists and is available
    const staff = await DeliveryStaff.findOne({ _id: data.deliveryStaff, isActive: true });
    if (!staff) throw new NotFoundError('Delivery staff');
    if (!staff.isAvailable) {
      throw new ValidationError('Delivery staff is not available');
    }

    // Create assignment with status 'assigned'
    const assignment = await DeliveryAssignment.create({
      order: data.order,
      deliveryStaff: data.deliveryStaff,
      status: APP_CONSTANTS.DELIVERY_STATUS.ASSIGNED,
      notes: data.notes,
      distance: data.distance,
      estimatedTime: data.estimatedTime,
      assignedAt: new Date(),
      createdBy: userId,
    });

    // Update order status to 'assigned' if it's currently 'packed'
    if (order.status === APP_CONSTANTS.ORDER_STATUS.PACKED) {
      await orderService.updateStatus(
        data.order,
        APP_CONSTANTS.ORDER_STATUS.ASSIGNED,
        userId
      );
    }

    return assignment.populate(['order', 'deliveryStaff']);
  }

  async getAll(query: AssignmentQuery) {
    const { skip, limit, page } = parsePagination(query);

    const filter: any = { isActive: true };
    if (query.deliveryStaff) filter.deliveryStaff = query.deliveryStaff;
    if (query.status) filter.status = query.status;
    if (query.dateFrom || query.dateTo) {
      filter.assignedAt = {};
      if (query.dateFrom) filter.assignedAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.assignedAt.$lte = new Date(query.dateTo);
    }

    const sortField = query.sort || 'assignedAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      DeliveryAssignment.find(filter)
        .populate('order', 'orderNumber status customer deliveryAddress')
        .populate('deliveryStaff', 'name phone vehicleType')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryAssignment.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string): Promise<IDeliveryAssignment> {
    const assignment = await DeliveryAssignment.findOne({ _id: id, isActive: true })
      .populate('order')
      .populate('deliveryStaff');
    if (!assignment) throw new NotFoundError('Delivery assignment');
    return assignment;
  }

  async getByOrder(orderId: string): Promise<IDeliveryAssignment> {
    const assignment = await DeliveryAssignment.findOne({ order: orderId, isActive: true })
      .populate('order')
      .populate('deliveryStaff');
    if (!assignment) throw new NotFoundError('Delivery assignment for this order');
    return assignment;
  }

  async updateStatus(
    id: string,
    newStatus: DeliveryStatus,
    userId?: string,
    data?: UpdateStatusData
  ): Promise<IDeliveryAssignment> {
    const assignment = await DeliveryAssignment.findOne({ _id: id, isActive: true });
    if (!assignment) throw new NotFoundError('Delivery assignment');

    const currentStatus = assignment.status as DeliveryStatus;
    const allowedTransitions = VALID_DELIVERY_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions.join(', ') || 'none (terminal state)'}`
      );
    }

    const now = new Date();
    assignment.status = newStatus;
    assignment.updatedBy = userId as any;

    if (data?.notes) assignment.notes = data.notes;

    switch (newStatus) {
      case APP_CONSTANTS.DELIVERY_STATUS.PICKED_UP:
        assignment.pickedUpAt = now;
        // Update order status to out_for_delivery
        await orderService.updateStatus(
          assignment.order.toString(),
          APP_CONSTANTS.ORDER_STATUS.OUT_FOR_DELIVERY,
          userId
        );
        break;

      case APP_CONSTANTS.DELIVERY_STATUS.DELIVERED:
        assignment.deliveredAt = now;
        if (data?.proofOfDelivery) assignment.proofOfDelivery = data.proofOfDelivery;
        // Update order status to delivered
        await orderService.updateStatus(
          assignment.order.toString(),
          APP_CONSTANTS.ORDER_STATUS.DELIVERED,
          userId
        );
        // Increment staff completed deliveries
        await DeliveryStaff.findByIdAndUpdate(assignment.deliveryStaff, {
          $inc: { completedDeliveries: 1 },
        });
        break;

      case APP_CONSTANTS.DELIVERY_STATUS.FAILED:
        assignment.failedAt = now;
        if (data?.failureReason) assignment.failureReason = data.failureReason;
        // Mark staff as available again
        await DeliveryStaff.findByIdAndUpdate(assignment.deliveryStaff, {
          isAvailable: true,
        });
        break;
    }

    await assignment.save();

    return assignment.populate(['order', 'deliveryStaff']);
  }

  async getStaffAssignments(staffId: string, query: AssignmentQuery) {
    // Verify staff exists
    const staff = await DeliveryStaff.findOne({ _id: staffId, isActive: true });
    if (!staff) throw new NotFoundError('Delivery staff');

    const { skip, limit, page } = parsePagination(query);

    const filter: any = { deliveryStaff: staffId, isActive: true };
    if (query.status) filter.status = query.status;

    const sortField = query.sort || 'assignedAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      DeliveryAssignment.find(filter)
        .populate('order', 'orderNumber status customer deliveryAddress')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryAssignment.countDocuments(filter),
    ]);

    return { data, pagination: buildPaginationMeta(total, page, limit) };
  }
}

export const deliveryStaffService = new DeliveryStaffService();
export const deliveryAssignmentService = new DeliveryAssignmentService();
