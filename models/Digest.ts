import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDigest } from '@/types';

export interface DigestDocument extends Omit<IDigest, '_id'>, Document {}

const DigestRowSchema = new Schema(
  {
    complaintId: { type: String, required: true },
    summary: { type: String, required: true },
    urgency: { type: String, required: true },
    category: { type: String, required: true },
    flatNumber: { type: String, required: true },
    wing: { type: String, required: true },
    status: { type: String, required: true },
    isSafetyRisk: { type: Boolean, default: false },
    suggestedAction: { type: String, default: '' },
  },
  { _id: false }
);

const DigestSchema = new Schema<DigestDocument>(
  {
    date: { type: String, required: true, unique: true, index: true },
    stats: {
      urgentCount: { type: Number, default: 0 },
      newCount: { type: Number, default: 0 },
      overdueCount: { type: Number, default: 0 },
      mergedDuplicatesCount: { type: Number, default: 0 },
      totalOpenCount: { type: Number, default: 0 },
    },
    summaryHeadline: { type: String, required: true },
    rows: { type: [DigestRowSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const DigestModel: Model<DigestDocument> =
  mongoose.models.Digest || mongoose.model<DigestDocument>('Digest', DigestSchema);
export default DigestModel;
