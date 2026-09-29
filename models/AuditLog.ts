import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAuditLog } from '@/types';

export interface AuditLogDocument extends Omit<IAuditLog, '_id'>, Document {}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    action: { type: String, required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, enum: ['admin', 'member', 'demo'], required: true },
    details: { type: String, required: true },
    count: { type: Number, default: 0 },
    targetType: {
      type: String,
      enum: ['complaint', 'attachment', 'demo', 'batch'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel: Model<AuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);
export default AuditLogModel;
