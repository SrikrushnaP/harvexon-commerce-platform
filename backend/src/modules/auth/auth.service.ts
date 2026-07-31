import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { User, IUser } from './user.model';
import { AppError, ConflictError, UnauthorizedError } from '../../common/middleware';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  /**
   * Generate access and refresh tokens
   */
  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: IUser; tokens: AuthTokens }> {
    // Check if email already exists
    const existingEmail = await User.findOne({ email: data.email });
    if (existingEmail) {
      throw new ConflictError('Email already registered');
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone: data.phone });
    if (existingPhone) {
      throw new ConflictError('Phone number already registered');
    }

    // Create user
    const user = await User.create(data);

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Return user without sensitive fields
    const userObj: any = user.toJSON();
    delete userObj.password;
    delete userObj.refreshToken;

    return { user: userObj as IUser, tokens };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<{ user: IUser; tokens: AuthTokens }> {
    // Find user with password field
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token and last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Return user without sensitive fields
    const userObj: any = user.toJSON();
    delete userObj.password;
    delete userObj.refreshToken;

    return { user: userObj as IUser, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
      
      // Find user and verify refresh token matches
      const user = await User.findById(decoded.id).select('+refreshToken');
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Save new refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save();

      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Logout - invalidate refresh token
   */
  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<{ name: string; phone: string }>): Promise<IUser> {
    // Check phone uniqueness if being updated
    if (data.phone) {
      const existing = await User.findOne({ phone: data.phone, _id: { $ne: userId } });
      if (existing) {
        throw new ConflictError('Phone number already in use');
      }
    }

    const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  }
}

export const authService = new AuthService();
