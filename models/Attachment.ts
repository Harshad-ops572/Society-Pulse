import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachment {
  _id?: string;
  data: Buffer;
  contentType: string; // e.g. 'image/webp', 'image/jpeg', 'image/png'
  size: number;
  filename: string;
  createdAt: Date;
}

export interface AttachmentDocument extends Document {
  data: Buffer;
  contentType: string;
  size: number;
  filename: string;
  createdAt: Date;
}

const AttachmentSchema = new Schema<AttachmentDocument>(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    filename: { type: String, required: true },
  },
  { timestamps: true }
);

export const AttachmentModel: Model<AttachmentDocument> =
  mongoose.models.Attachment || mongoose.model<AttachmentDocument>('Attachment', AttachmentSchema);
export default AttachmentModel;
