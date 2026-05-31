import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../modules/users/user.model';

export interface DecodedToken {
  userId: string;
  email: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (env.NODE_ENV === 'development') {
      try {
        // Ensure mock user is seeded in MongoDB Atlas or local DB (awaited to prevent race conditions)
        await User.findOneAndUpdate(
          { _id: '60c72b2f9b1d8e2a3c8b4567' },
          {
            $setOnInsert: {
              name: 'Developer Tate',
              email: 'tate@invoicon.com',
              passwordHash: '$2a$10$abcdefghijklmnopqrstuv', // dummy hash
              businessName: 'Tate Enterprise Inc',
              businessAddress: '123 Financial Boulevard, Suite 500',
              invoicePrefix: 'INV',
              defaultCurrency: 'USD',
              defaultTaxPercentage: 18,
              plan: 'pro'
            }
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('⚠️ Mock developer user seeding failed:', err);
      }

      // Inject development mock user session to bypass auth loops in testing
      (req as any).user = {
        _id: '60c72b2f9b1d8e2a3c8b4567',
        email: 'tate@invoicon.com'
      };
      next();
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authorization credentials provided'
      }
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as DecodedToken;
    
    // Attach decoded user parameters to request namespace
    (req as any).user = {
      _id: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access session expired. Please rotate your tokens.'
        }
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Supplied authentication credentials are invalid'
      }
    });
  }
}
