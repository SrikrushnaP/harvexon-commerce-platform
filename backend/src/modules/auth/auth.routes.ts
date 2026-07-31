import { Router, IRouter } from 'express';
import * as authController from './auth.controller';
import { authenticate } from './auth.middleware';
import { validate } from '../../common/middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from './auth.validators';
import * as myAddressController from './my-address.controller';
import { myCreateAddressSchema, myUpdateAddressSchema } from './my-address.validators';

const router: IRouter = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// Protected routes (requires authentication)
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.delete('/profile', authenticate, authController.deleteAccount);

// Customer-facing address routes (authenticated users manage their own addresses)
router.get('/addresses', authenticate, myAddressController.getMyAddresses);
router.post('/addresses', authenticate, validate(myCreateAddressSchema), myAddressController.createMyAddress);
router.patch('/addresses/:id', authenticate, validate(myUpdateAddressSchema), myAddressController.updateMyAddress);
router.delete('/addresses/:id', authenticate, myAddressController.deleteMyAddress);

export default router;
