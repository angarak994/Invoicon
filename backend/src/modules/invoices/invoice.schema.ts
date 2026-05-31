import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Line item description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative') // in cents
});

export const createInvoiceSchema = z.object({
  body: z.object({
    fromName: z.string().min(1, 'Sender business name is required'),
    fromAddress: z.string().optional(),
    fromEmail: z.string().email().optional().or(z.literal('')),
    toName: z.string().min(1, 'Client name is required'),
    toAddress: z.string().optional(),
    toEmail: z.string().email().optional().or(z.literal('')),
    invoiceDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform(val => val ? new Date(val) : new Date()),
    dueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).transform(val => val ? new Date(val) : undefined).optional(),
    lineItems: z.array(lineItemSchema).nonempty('At least one line item is required'),
    taxPercentage: z.number().min(0).max(100).default(0),
    discountType: z.enum(['flat', 'percentage']).optional(),
    discountValue: z.number().min(0).optional(),
    currency: z.string().length(3).default('USD'),
    templateId: z.enum(['standard', 'retail', 'restaurant', 'rental', 'construction', 'professional', 'creative', 'startup', 'elegant']).default('standard'),
    fontFamily: z.string().default('Inter'),
    colorScheme: z.string().default('#01019d'),
    logoUrl: z.string().url().optional().or(z.literal('')),
    signatureType: z.enum(['none', 'font', 'draw']).default('none'),
    signatureName: z.string().optional(),
    signatureImageBase64: z.string().optional(),
    notes: z.string().optional(),
    paymentInstructions: z.string().optional(),
    termsAndConditions: z.string().optional(),
    customFields: z.record(z.string(), z.string()).optional()
  })
});

export const updateInvoiceSchema = z.object({
  body: createInvoiceSchema.shape.body.partial()
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['draft', 'sent', 'paid', 'overdue'])
  })
});
