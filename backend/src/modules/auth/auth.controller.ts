import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../users/user.model';
import { LoginAttempt } from '../users/loginAttempt.model';
import { PasswordResetToken } from '../users/passwordResetToken.model';
import * as jwtUtil from '../../utils/jwt';
// safeCompare removed — token comparison uses bcrypt.compare() only
import { sendWelcomeEmail, sendResetPasswordEmail } from '../../services/email.service';
import { env } from '../../config/env';

// Cookie options for Refresh Token
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Use standard error response and keep it generic to avoid email enumeration
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'An account with these credentials already exists.'
        }
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash
    });

    const accessToken = jwtUtil.signAccessToken(user._id.toString(), user.email);
    const refreshToken = jwtUtil.signRefreshToken(user._id.toString(), user.email);

    // Hash refresh token before saving in DB
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    // Dispatch welcome email asynchronously
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email, password } = req.body;
  const ipAddress = req.ip || '127.0.0.1';

  try {
    const user = await User.findOne({ email });

    if (!user) {
      await LoginAttempt.create({ email, ipAddress, success: false });
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect email address or password provided'
        }
      });
      return;
    }

    // Check account lockout status
    if (user.lockUntil && user.lockUntil > new Date()) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `This account has been locked due to too many failed attempts. Try again after ${user.lockUntil.toLocaleTimeString()}`,
          lockUntil: user.lockUntil
        }
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      // Increment login failures
      user.loginAttempts += 1;
      await LoginAttempt.create({ email, ipAddress, success: false });

      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }
      
      await user.save();

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect email address or password provided'
        }
      });
      return;
    }

    // Success: reset failures and generate tokens
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const accessToken = jwtUtil.signAccessToken(user._id.toString(), user.email);
    const refreshToken = jwtUtil.signRefreshToken(user._id.toString(), user.email);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    await LoginAttempt.create({ email, ipAddress, success: true });

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          plan: user.plan
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No credentials provided for rotation'
      }
    });
    return;
  }

  try {
    const decoded = jwtUtil.verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokenHash) {
      res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          message: 'Active session credentials not found'
        }
      });
      return;
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isMatch) {
      // BREACH ALERT: Session reuse detected! Revoke all sessions to protect database
      user.refreshTokenHash = undefined;
      await user.save();
      res.clearCookie('refreshToken');
      res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          message: 'Breach detected: session reuse triggered revocation of all credentials'
        }
      });
      return;
    }

    // Success: rotate access and refresh tokens
    const newAccessToken = jwtUtil.signAccessToken(user._id.toString(), user.email);
    const newRefreshToken = jwtUtil.signRefreshToken(user._id.toString(), user.email);

    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Invalid session credentials'
      }
    });
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
    }

    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    // Always return 200 to prevent email enumeration scans
    if (!user) {
      res.status(200).json({
        success: true,
        data: {
          message: 'If an account matches this address, a password recovery link has been sent.'
        }
      });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);

    // Save recovery token with 1-hour TTL
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash
    });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
    
    if (env.NODE_ENV === 'development') {
      console.log('\n🔑 [DEVELOPMENT RESET PASSWORD TOKEN DETECTED]');
      console.log('🔗 RESET URL:', resetUrl);
      console.log('🎫 TOKEN:', rawToken);
      console.log('─────────────────────────────────────────────\n');
    }
    
    // Dispatch recovery mail asynchronously
    sendResetPasswordEmail(user.email, resetUrl).catch(console.error);

    res.status(200).json({
      success: true,
      data: {
        message: 'If an account matches this address, a password recovery link has been sent.'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { token, password } = req.body;

  try {
    // Find all active, non-expired reset tokens (created within the last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const resetTokens = await PasswordResetToken.find({
      used: false,
      createdAt: { $gte: oneHourAgo }
    });

    let matchedTokenDoc = null;

    for (const doc of resetTokens) {
      // ONLY use bcrypt.compare — hashSync produces a new hash every call and can never match
      const match = await bcrypt.compare(token, doc.tokenHash);
      if (match) {
        matchedTokenDoc = doc;
        break;
      }
    }

    if (!matchedTokenDoc) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'The recovery token provided is invalid or has expired'
        }
      });
      return;
    }

    const user = await User.findById(matchedTokenDoc.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Account not found'
        }
      });
      return;
    }

    // Reset password & clear active session hashes (force re-login everywhere)
    user.passwordHash = await bcrypt.hash(password, 10);
    user.refreshTokenHash = undefined;
    await user.save();

    matchedTokenDoc.used = true;
    await matchedTokenDoc.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset successfully. Please log in with your new credentials.'
      }
    });
  } catch (error) {
    next(error);
  }
}
