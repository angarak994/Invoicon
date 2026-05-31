import { Request, Response, NextFunction } from 'express';
import { User } from './user.model';
import { Invoice } from '../invoices/invoice.model';

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const user = await User.findById(userId).select('-passwordHash -refreshTokenHash');

    if (!user || user.deletedAt) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Account not found or has been deleted'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select('-passwordHash -refreshTokenHash');

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

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;

    // soft delete account configuration
    const user = await User.findByIdAndUpdate(userId, {
      $set: { deletedAt: new Date(), isDeleted: true },
      $unset: { refreshTokenHash: 1 }
    });

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

    // Cascade: soft-delete all invoice documents linked to user
    await Invoice.updateMany(
      { userId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      data: {
        message: 'Account deletion initiated. Your profile and invoices will be purged after 30 days.'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function exportMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    
    const user = await User.findById(userId).select('-passwordHash -refreshTokenHash');
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

    const invoices = await Invoice.find({ userId, isDeleted: false });

    // Stream out data as export file for GDPR portability compliance
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="invoicon-data-export-${userId}.json"`);
    
    res.status(200).json({
      success: true,
      data: {
        profile: user,
        invoices
      }
    });
  } catch (error) {
    next(error);
  }
}
