import { Request, Response, NextFunction } from 'express';
import { Invoice, ILineItem } from './invoice.model';
import { User } from '../users/user.model';
import { assertOwnership } from '../../utils/ownershipCheck';
import { Types } from 'mongoose';
import { generateInvoicePDF } from '../../services/pdf.service';

// Dynamic calculations in cents
function calculateInvoiceTotals(body: any) {
  const lineItems = (body.lineItems || []).map((item: any) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    return {
      description: item.description,
      quantity: qty,
      unitPrice: price,
      amount: Math.round(qty * price) // quantity * unitPrice in cents
    };
  });

  const subtotal = lineItems.reduce((acc: number, item: ILineItem) => acc + item.amount, 0);
  
  // Tax computations
  const taxPercentage = Number(body.taxPercentage || 0);
  const taxAmount = Math.round(subtotal * (taxPercentage / 100));

  // Discount computations
  let discountAmount = 0;
  if (body.discountType === 'flat') {
    discountAmount = Math.round(Number(body.discountValue || 0));
  } else if (body.discountType === 'percentage') {
    discountAmount = Math.round(subtotal * (Number(body.discountValue || 0) / 100));
  }

  const total = Math.max(0, subtotal + taxAmount - discountAmount);

  return {
    lineItems,
    subtotal,
    taxPercentage,
    taxAmount,
    discountType: body.discountType,
    discountValue: body.discountValue,
    discountAmount,
    total
  };
}

export async function createInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User profile not found'
        }
      });
      return;
    }

    // Limit Enforcement: free plans are capped at 10 documents
    if (user.plan === 'free') {
      const activeCount = await Invoice.countDocuments({ userId, isDeleted: false });
      if (activeCount >= 10) {
        res.status(403).json({
          success: false,
          error: {
            code: 'PLAN_LIMIT_REACHED',
            message: "You've reached the 10 invoice limit on the Free plan. Upgrade to Pro for unlimited invoices."
          }
        });
        return;
      }
    }

    const calculatedTotals = calculateInvoiceTotals(req.body);

    // Atomic increment sequence on User Document
    const userCounter = await User.findOneAndUpdate(
      { _id: userId },
      { $inc: { nextInvoiceNumber: 1 } },
      { new: false } // Return BEFORE increment to get the current count to use
    );

    if (!userCounter) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Error synchronizing invoice sequence'
        }
      });
      return;
    }

    const invoiceNumber = `${userCounter.invoicePrefix}-${String(userCounter.nextInvoiceNumber).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      ...req.body,
      ...calculatedTotals,
      userId,
      invoiceNumber,
      status: 'draft',
      isDeleted: false
    });

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function listInvoices(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const query: any = { userId, isDeleted: false };

    // Search filters
    if (req.query.search) {
      query.$or = [
        { toName: { $regex: req.query.search, $options: 'i' } },
        { invoiceNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Status filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Sorting configurations
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortParams: any = {};
    sortParams[sortBy] = sortOrder;

    const invoices = await Invoice.find(query)
      .sort(sortParams)
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const invoiceId = String(req.params.id);

    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const invoiceId = String(req.params.id);

    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    if (invoice.status === 'archived') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Cannot modify invoices that have been archived'
        }
      });
      return;
    }

    const calculatedTotals = calculateInvoiceTotals({
      ...invoice.toObject(),
      ...req.body
    });

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      {
        $set: {
          ...req.body,
          ...calculatedTotals
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoiceStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const invoiceId = String(req.params.id);
    const { status } = req.body;

    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    invoice.status = status;
    await invoice.save();

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const invoiceId = String(req.params.id);

    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    // Soft Delete: shift document targets to 30d TTL Trash mode
    invoice.isDeleted = true;
    invoice.deletedAt = new Date();
    await invoice.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Invoice successfully moved to trash. You can restore it within 30 days.'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function listTrash(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    
    // Find all soft-deleted records under active TTL configurations
    const trashInvoices = await Invoice.find({
      userId,
      isDeleted: true
    }).sort({ deletedAt: -1 });

    const results = trashInvoices.map((inv) => {
      const deletedTime = new Date(inv.deletedAt!).getTime();
      const ageMs = Date.now() - deletedTime;
      const daysRemaining = Math.max(0, 30 - Math.floor(ageMs / (24 * 60 * 60 * 1000)));
      
      return {
        ...inv.toObject(),
        daysRemaining
      };
    });

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const invoiceId = String(req.params.id);

    // Direct Mongoose assertions to handle bypassed soft-delete constraints
    const invoice = await Invoice.findOne({
      _id: new Types.ObjectId(invoiceId),
      userId: new Types.ObjectId(userId),
      isDeleted: true
    });

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Soft deleted invoice not found'
        }
      });
      return;
    }

    invoice.isDeleted = false;
    invoice.deletedAt = undefined;
    invoice.status = 'draft';
    await invoice.save();

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}

export async function permanentDeleteInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const invoiceId = String(req.params.id);

    const invoice = await Invoice.findOne({
      _id: new Types.ObjectId(invoiceId),
      userId: new Types.ObjectId(userId),
      isDeleted: true
    });

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Soft deleted invoice not found'
        }
      });
      return;
    }

    // Irreversible hard deletion
    await Invoice.deleteOne({ _id: invoiceId });

    res.status(200).json({
      success: true,
      data: {
        message: 'Invoice permanently removed'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadInvoice(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    const invoiceId = String(req.params.id);

    const invoice = await assertOwnership(Invoice, invoiceId, userId);

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

import { getTemplateHtml } from '../../services/templates/template.registry';

export async function previewInvoiceHtml(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?._id;
    
    // We create a mock invoice document from the request body to pass to the template engine
    const invoiceData = {
      ...req.body,
      userId,
      invoiceDate: new Date(req.body.invoiceDate || Date.now()),
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    } as any;
    
    // Calculate totals just like the real creation
    const calculatedTotals = calculateInvoiceTotals(invoiceData);
    
    const mockInvoice = {
      ...invoiceData,
      ...calculatedTotals
    };

    const htmlContent = getTemplateHtml(mockInvoice);

    res.status(200).send(htmlContent);
  } catch (error) {
    next(error);
  }
}
