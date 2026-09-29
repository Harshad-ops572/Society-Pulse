import mongoose, { Schema, Document, Model } from 'mongoose';
import { IComplaint } from '@/types';

export interface ComplaintDocument extends Omit<IComplaint, '_id'>, Document {}

const TimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String, required: true },
    by: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InternalNoteSchema = new Schema(
  {
    note: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ComplaintSchema = new Schema<ComplaintDocument>(
  {
    complaintId: { type: String, required: true, unique: true, index: true },
    originalText: { type: String, required: true },
    translatedText: { type: String, default: '' },
    language: { type: String, enum: ['en', 'hi', 'hinglish'], default: 'en' },
    summary: { type: String, default: '' },
    category: {
      type: String,
      enum: ['water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other'],
      required: true,
      index: true,
    },
    urgency: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    urgencyScore: { type: Number, default: 50, index: true },
    urgencyReason: { type: String, default: '' },
    isSafetyRisk: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['new', 'triaged', 'assigned', 'in_progress', 'resolved', 'rejected', 'reopened'],
      default: 'new',
      index: true,
    },
    wing: { type: String, required: true, index: true },
    flatNumber: { type: String, required: true },
    commonArea: { type: String, default: '' },
    residentName: { type: String, required: true },
    phone: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    voiceTranscript: { type: String, default: '' },
    duplicateOf: { type: String, default: null },
    reportCount: { type: Number, default: 1 },
    assignedTo: { type: String, default: null },
    needsManualTriage: { type: Boolean, default: false },
    aiOverridden: { type: Boolean, default: false },
    slaDueAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
    residentConfirmed: { type: Boolean, default: null },
    timeline: { type: [TimelineSchema], default: [] },
    internalNotes: { type: [InternalNoteSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast query performance in high-volume committee triage
ComplaintSchema.index({ status: 1, urgencyScore: -1 });
ComplaintSchema.index({ wing: 1, category: 1 });
ComplaintSchema.index({ createdAt: -1 });

export const ComplaintModel: Model<ComplaintDocument> =
  mongoose.models.Complaint || mongoose.model<ComplaintDocument>('Complaint', ComplaintSchema);
export default ComplaintModel;
