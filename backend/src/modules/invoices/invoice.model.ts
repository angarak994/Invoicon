import { Schema, model, Document, Types } from 'mongoose';

export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  amount: number; // in cents
}

export interface IInvoice extends Document {
  userId: Types.ObjectId;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  fromName: string;
  fromAddress?: string;
  fromEmail?: string;
  toName: string;
  toAddress?: string;
  toEmail?: string;
  invoiceDate: Date;
  dueDate?: Date;
  lineItems: ILineItem[];
  subtotal: number; // in cents
  taxPercentage: number;
  taxAmount: number; // in cents
  discountType?: 'flat' | 'percentage';
  discountValue?: number;
  discountAmount: number; // in cents
  total: number; // in cents
  currency: string;
  templateId: 'standard' | 'retail' | 'restaurant' | 'rental' | 'construction' | 'professional' | 'creative' | 'startup' | 'elegant';
  fontFamily?: string;
  colorScheme?: string;
  logoUrl?: string;
  signatureType: 'none' | 'font' | 'draw' | 'upload';
  signatureName?: string;
  signatureImageBase64?: string;
  notes?: string;
  paymentInstructions?: string;
  termsAndConditions?: string;
  customFields?: Record<string, string>;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<ILineItem>({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unitPrice: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 }
});

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceNumber: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'sent', 'paid', 'overdue'],
      default: 'draft'
    },
    fromName: { type: String, required: true, trim: true },
    fromAddress: { type: String, trim: true },
    fromEmail: { type: String, lowercase: true, trim: true },
    toName: { type: String, required: true, trim: true },
    toAddress: { type: String, trim: true },
    toEmail: { type: String, lowercase: true, trim: true },
    invoiceDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    lineItems: { type: [lineItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    taxPercentage: { type: Number, required: true, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, required: true, default: 0, min: 0 },
    discountType: { type: String, enum: ['flat', 'percentage'] },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: 'USD', trim: true },
    templateId: {
      type: String,
      enum: ['standard', 'retail', 'restaurant', 'rental', 'construction', 'professional', 'creative', 'startup', 'elegant'],
      default: 'standard'
    },
    fontFamily: { type: String, trim: true },
    colorScheme: { type: String, trim: true },
    logoUrl: { type: String },
    signatureType: {
      type: String,
      required: true,
      enum: ['none', 'font', 'draw', 'upload'],
      default: 'none'
    },
    signatureName: { type: String, trim: true },
    signatureImageBase64: { type: String },
    notes: { type: String, trim: true },
    paymentInstructions: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
    customFields: { type: Map, of: String },
    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

// Optimize lookups: filter by userId and index invoice soft deletes + searches
invoiceSchema.index({ userId: 1, isDeleted: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ toName: 1 });

// Configure 30-day soft-delete auto-pruning TTL index in MongoDB
invoiceSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);
