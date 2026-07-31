import { Cart, ICart } from './cart.model';
import { Product } from '../catalog';
import { NotFoundError } from '../../common/middleware';

class CartService {
  async getCart(customerId: string) {
    let cart = await Cart.findOne({ customer: customerId })
      .populate('items.product', 'name slug basePrice images unit trackInventory')
      .lean();

    if (!cart) {
      return { items: [], total: 0, count: 0 };
    }

    // Filter out items where product was deleted
    const validItems = cart.items.filter((item: any) => item.product);

    const items = validItems.map((item: any) => ({
      id: item._id.toString(),
      productId: item.product._id.toString(),
      name: item.product.name,
      slug: item.product.slug,
      basePrice: item.product.basePrice,
      unit: item.product.unit?.shortName || 'pc',
      image: item.product.images?.[0] || null,
      quantity: item.quantity,
      lineTotal: item.product.basePrice * item.quantity,
    }));

    const total = items.reduce((sum: number, i: any) => sum + i.lineTotal, 0);
    const count = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

    return { items, total, count };
  }

  async addItem(customerId: string, productId: string, quantity: number = 1) {
    // Verify product exists
    const product = await Product.findById(productId).select('_id name basePrice').lean();
    if (!product) throw new NotFoundError('Product not found');

    let cart = await Cart.findOne({ customer: customerId });

    if (!cart) {
      cart = await Cart.create({
        customer: customerId,
        items: [{ product: productId, quantity }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity } as any);
      }
      await cart.save();
    }

    return this.getCart(customerId);
  }

  async updateItemQuantity(customerId: string, itemId: string, quantity: number) {
    const cart = await Cart.findOne({ customer: customerId });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = cart.items.find((i: any) => i._id.toString() === itemId);
    if (!item) throw new NotFoundError('Item not found in cart');

    if (quantity <= 0) {
      cart.items = cart.items.filter((i: any) => i._id.toString() !== itemId) as any;
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    return this.getCart(customerId);
  }

  async removeItem(customerId: string, itemId: string) {
    const cart = await Cart.findOne({ customer: customerId });
    if (!cart) throw new NotFoundError('Cart not found');

    cart.items = cart.items.filter((i: any) => i._id.toString() !== itemId) as any;
    await cart.save();
    return this.getCart(customerId);
  }

  async clearCart(customerId: string) {
    await Cart.findOneAndUpdate(
      { customer: customerId },
      { $set: { items: [] } }
    );
    return { items: [], total: 0, count: 0 };
  }

  async syncCart(customerId: string, items: { productId: string; quantity: number }[]) {
    // Verify all products exist
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).select('_id').lean();
    const validIds = new Set(products.map((p: any) => p._id.toString()));

    const validItems = items
      .filter(i => validIds.has(i.productId))
      .map(i => ({ product: i.productId, quantity: i.quantity }));

    await Cart.findOneAndUpdate(
      { customer: customerId },
      { $set: { items: validItems } },
      { upsert: true }
    );

    return this.getCart(customerId);
  }
}

export const cartService = new CartService();
