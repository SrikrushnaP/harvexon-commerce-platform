/**
 * Application-wide constants
 * These are fixed values, not configurable via environment.
 */

export const APP_CONSTANTS = {
  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // User roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    DELIVERY: 'delivery',
    CUSTOMER: 'customer',
  } as const,

  // Order statuses
  ORDER_STATUS: {
    DRAFT: 'draft',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    PACKED: 'packed',
    ASSIGNED: 'assigned',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURNED: 'returned',
  } as const,

  // Inventory transaction types
  INVENTORY_TRANSACTION_TYPE: {
    PURCHASE: 'purchase',
    SALE: 'sale',
    RETURN: 'return',
    DAMAGE: 'damage',
    ADJUSTMENT: 'adjustment',
    TRANSFER: 'transfer',
  } as const,

  // Delivery statuses
  DELIVERY_STATUS: {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    FAILED: 'failed',
  } as const,

  // Customer group types
  CUSTOMER_GROUP_TYPE: {
    RETAIL: 'retail',
    WHOLESALE: 'wholesale',
    DISTRIBUTOR: 'distributor',
    RESTAURANT: 'restaurant',
    VIP: 'vip',
  } as const,

  // Pricing types
  PRICING_TYPE: {
    BASE: 'base',
    GROUP: 'group',
    CUSTOMER: 'customer',
    QUANTITY_SLAB: 'quantity_slab',
  } as const,

  // Coupon types
  COUPON_TYPE: {
    PERCENTAGE: 'percentage',
    FLAT: 'flat',
    PRODUCT_SPECIAL_PRICE: 'product_special_price',
    BUY_X_GET_Y: 'buy_x_get_y',
    FREE_DELIVERY: 'free_delivery',
    FIRST_ORDER: 'first_order',
  } as const,

  // File upload
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES_PER_PRODUCT: 5,
} as const;

// Type helpers
export type Role = (typeof APP_CONSTANTS.ROLES)[keyof typeof APP_CONSTANTS.ROLES];
export type OrderStatus = (typeof APP_CONSTANTS.ORDER_STATUS)[keyof typeof APP_CONSTANTS.ORDER_STATUS];
export type InventoryTransactionType = (typeof APP_CONSTANTS.INVENTORY_TRANSACTION_TYPE)[keyof typeof APP_CONSTANTS.INVENTORY_TRANSACTION_TYPE];
export type DeliveryStatus = (typeof APP_CONSTANTS.DELIVERY_STATUS)[keyof typeof APP_CONSTANTS.DELIVERY_STATUS];
export type CustomerGroupType = (typeof APP_CONSTANTS.CUSTOMER_GROUP_TYPE)[keyof typeof APP_CONSTANTS.CUSTOMER_GROUP_TYPE];
export type PricingType = (typeof APP_CONSTANTS.PRICING_TYPE)[keyof typeof APP_CONSTANTS.PRICING_TYPE];
export type CouponType = (typeof APP_CONSTANTS.COUPON_TYPE)[keyof typeof APP_CONSTANTS.COUPON_TYPE];
