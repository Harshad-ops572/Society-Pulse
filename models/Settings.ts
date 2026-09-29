import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISettings } from '@/types';

export interface SettingsDocument extends Omit<ISettings, '_id'>, Document {}

const SettingsSchema = new Schema<SettingsDocument>(
  {
    slaHours: {
      critical: { type: Number, default: 2 },
      high: { type: Number, default: 6 },
      medium: { type: Number, default: 24 },
      low: { type: Number, default: 72 },
    },
    categories: {
      type: [String],
      default: ['water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other'],
    },
    wings: {
      type: [String],
      default: ['A', 'B', 'C', 'D'],
    },
    societyName: { type: String, default: 'Greenwood Palms Co-op Housing Society' },
    totalFlats: { type: Number, default: 120 },
  },
  {
    timestamps: true,
  }
);

export const SettingsModel: Model<SettingsDocument> =
  mongoose.models.Settings || mongoose.model<SettingsDocument>('Settings', SettingsSchema);
export default SettingsModel;
