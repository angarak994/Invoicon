import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    businessName: z.string().max(100).optional(),
    businessAddress: z.string().max(300).optional(),
    invoicePrefix: z.string().min(1).max(10).optional(),
    defaultCurrency: z.string().length(3).optional(),
    defaultTaxPercentage: z.number().min(0).max(100).optional(),
    defaultTemplate: z.enum(['standard', 'retail', 'restaurant', 'rental', 'construction', 'professional', 'creative', 'startup', 'elegant']).optional(),
    defaultPaymentInstructions: z.string().optional(),
    defaultTermsAndConditions: z.string().optional()
  })
});

export const deleteAccountSchema = z.object({
  body: z.object({
    confirmText: z.string().refine(val => val === 'DELETE MY ACCOUNT', {
      message: 'Please input exactly "DELETE MY ACCOUNT" to confirm'
    })
  })
});
