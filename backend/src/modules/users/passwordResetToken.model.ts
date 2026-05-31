import { Schema, model, Document, Types } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  used: boolean;
  createdAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },
  used: { type: Boolean, required: true, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Configure MongoDB TTL to expire the reset token after 1 hour (3600 seconds)
passwordResetTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
passwordResetTokenSchema.index({ tokenHash: 1 });

export const PasswordResetToken = model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);
