import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  refreshTokenHash?: string;
  businessName?: string;
  businessAddress?: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultCurrency: string;
  defaultTaxPercentage: number;
  logoUrl?: string;
  defaultTemplate?: 'classic' | 'modern' | 'minimal' | 'standard' | 'retail' | 'restaurant' | 'rental' | 'construction' | 'professional';
  defaultPaymentInstructions?: string;
  defaultTermsAndConditions?: string;
  isEmailVerified: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  plan: 'free' | 'pro';
  planExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String },
    businessName: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    invoicePrefix: { type: String, required: true, default: 'INV', trim: true },
    nextInvoiceNumber: { type: Number, required: true, default: 1 },
    defaultCurrency: { type: String, required: true, default: 'USD', uppercase: true, trim: true },
    defaultTaxPercentage: { type: Number, required: true, default: 0 },
    logoUrl: { type: String },
    defaultTemplate: { type: String, enum: ['classic', 'modern', 'minimal', 'standard', 'retail', 'restaurant', 'rental', 'construction', 'professional'], default: 'standard' },
    defaultPaymentInstructions: { type: String, trim: true },
    defaultTermsAndConditions: { type: String, trim: true },
    isEmailVerified: { type: Boolean, required: true, default: false },
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date },
    plan: { type: String, required: true, enum: ['free', 'pro'], default: 'free' },
    planExpiresAt: { type: Date },
    deletedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const User = model<IUser>('User', userSchema);
