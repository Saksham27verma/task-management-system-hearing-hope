import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  postedBy: Types.ObjectId;
  attachmentUrl?: string;
  isImportant: boolean;
  expiryDate?: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a notice title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide notice content'],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide who posted this notice'],
    },
    attachmentUrl: {
      type: String,
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster querying
NoticeSchema.index({ createdAt: -1 });
NoticeSchema.index({ isImportant: 1 });

export default mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema); 