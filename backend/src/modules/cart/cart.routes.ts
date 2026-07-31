import { Router, IRouter } from 'express';
import * as cartController from './cart.controller';
import { authenticate } from '../auth';
import { validate } from '../../common/middleware';
import { addItemSchema, updateItemSchema, removeItemSchema, syncCartSchema } from './cart.validators';

const router: IRouter = Router();

// All cart routes require authentication
router.use(authenticate);

// Get cart
router.get('/', cartController.getCart);

// Add item
router.post('/items', validate(addItemSchema), cartController.addItem);

// Update item quantity
router.patch('/items/:itemId', validate(updateItemSchema), cartController.updateItem);

// Remove item
router.delete('/items/:itemId', validate(removeItemSchema), cartController.removeItem);

// Clear cart
router.delete('/', cartController.clearCart);

// Sync cart (merge localStorage cart with backend)
router.post('/sync', validate(syncCartSchema), cartController.syncCart);

export default router;
