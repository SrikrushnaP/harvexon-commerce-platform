import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, Role } from '../../config';
import { UnauthorizedError, ForbiddenError } from '../../common/middleware';
import { AuthRequest } from '../../common/types';
import { User } from './user.model';

/**
 * Authenticate - verify JWT token and attach user to request
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
    };

    // Verify user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    // Attach user info to request
    (req as AuthRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    if ((error as any).name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid access token'));
      return;
    }
    if ((error as any).name === 'TokenExpiredError') {
      next(new UnauthorizedError('Access token expired'));
      return;
    }
    next(error);
  }
};

/**
 * Authorize - check if user has required role(s)
 * Usage: authorize('admin', 'manager')
 */
export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { user } = req as AuthRequest;

    if (!user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(user.role as Role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
};
