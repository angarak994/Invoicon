import { Schema, model, Document } from 'mongoose';

export interface ILoginAttempt extends Document {
  email: string;
  ipAddress: string;
  success: boolean;
  createdAt: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>({
  email: { type: String, required: true, lowercase: true, trim: true },
  ipAddress: { type: String, required: true },
  success: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Configure MongoDB TTL to automatically prune document records after 1 hour (3600 seconds)
loginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
loginAttemptSchema.index({ email: 1, success: 1 });

export const LoginAttempt = model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);
