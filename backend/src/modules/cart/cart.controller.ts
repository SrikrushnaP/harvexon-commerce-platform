import { Request, Response } from 'express';
import { cartService } from './cart.service';
import { asyncHandler } from '../../common/middleware';
import { sendSuccess } from '../../common/utils';
import { AuthRequest } from '../../common/types';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const cart = await cartService.getCart(user!.id);
  sendSuccess(res, cart, 'Cart retrieved');
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const { productId, quantity } = req.body;
  const cart = await cartService.addItem(user!.id, productId, quantity || 1);
  sendSuccess(res, cart, 'Item added to cart');
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const { quantity } = req.body;
  const cart = await cartService.updateItemQuantity(user!.id, req.params.itemId as string, quantity);
  sendSuccess(res, cart, 'Cart updated');
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const cart = await cartService.removeItem(user!.id, req.params.itemId as string);
  sendSuccess(res, cart, 'Item removed from cart');
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const cart = await cartService.clearCart(user!.id);
  sendSuccess(res, cart, 'Cart cleared');
});

export const syncCart = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req as AuthRequest;
  const { items } = req.body;
  const cart = await cartService.syncCart(user!.id, items);
  sendSuccess(res, cart, 'Cart synced');
});
