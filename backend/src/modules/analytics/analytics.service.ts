import { Order } from '../order/order.model';
import { Customer } from '../customer/customer.model';
import { Product } from '../catalog/product.model';
import { APP_CONSTANTS } from '../../config';

interface DashboardData {
  today: {
    orders: number;
    revenue: number;
    newCustomers: number;
  };
  thisWeek: {
    orders: number;
    revenue: number;
  };
  thisMonth: {
    orders: number;
    revenue: number;
  };
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  totals: {
    customers: number;
    products: number;
    orders: number;
    revenue: number;
  };
}

const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfMonth = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

class AnalyticsService {
  async getDashboard(): Promise<DashboardData> {
    const now = new Date();
    const startOfToday = getStartOfDay(now);
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = getStartOfMonth(now);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const excludeCancelled = { status: { $ne: APP_CONSTANTS.ORDER_STATUS.CANCELLED } };

    const [
      todayStats,
      weekStats,
      monthStats,
      ordersByStatus,
      topProducts,
      revenueByDay,
      totals,
      newCustomersToday,
    ] = await Promise.all([
      // Today's orders & revenue (exclude cancelled)
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startOfToday },
            isActive: true,
            ...excludeCancelled,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
      ]),

      // This week's orders & revenue (exclude cancelled)
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startOfWeek },
            isActive: true,
            ...excludeCancelled,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
      ]),

      // This month's orders & revenue (exclude cancelled)
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startOfMonth },
            isActive: true,
            ...excludeCancelled,
          },
        },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
      ]),

      // Orders by status
      Order.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Top 10 products by quantity sold
      Order.aggregate([
        {
          $match: {
            isActive: true,
            ...excludeCancelled,
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.total' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            name: 1,
            quantity: 1,
            revenue: 1,
          },
        },
      ]),

      // Revenue by day (last 7 days)
      Order.aggregate([
        {
          $match: {
            orderDate: { $gte: sevenDaysAgo },
            isActive: true,
            ...excludeCancelled,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$orderDate' },
            },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            revenue: 1,
          },
        },
      ]),

      // Totals
      Promise.all([
        Customer.countDocuments({ isActive: true }),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments({ isActive: true }),
        Order.aggregate([
          {
            $match: {
              isActive: true,
              ...excludeCancelled,
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$total' },
            },
          },
        ]),
      ]),

      // New customers today
      Customer.countDocuments({
        createdAt: { $gte: startOfToday },
        isActive: true,
      }),
    ]);

    // Parse orders by status into a record
    const statusMap: Record<string, number> = {};
    for (const entry of ordersByStatus) {
      statusMap[entry._id] = entry.count;
    }

    const [customers, products, orders, totalRevenueResult] = totals;

    return {
      today: {
        orders: todayStats[0]?.orders || 0,
        revenue: todayStats[0]?.revenue || 0,
        newCustomers: newCustomersToday,
      },
      thisWeek: {
        orders: weekStats[0]?.orders || 0,
        revenue: weekStats[0]?.revenue || 0,
      },
      thisMonth: {
        orders: monthStats[0]?.orders || 0,
        revenue: monthStats[0]?.revenue || 0,
      },
      ordersByStatus: statusMap,
      topProducts,
      revenueByDay,
      totals: {
        customers,
        products,
        orders,
        revenue: totalRevenueResult[0]?.revenue || 0,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
