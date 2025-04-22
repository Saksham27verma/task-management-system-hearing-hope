import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: Date;
  isTaskRelated: boolean;
  relatedTask?: Types.ObjectId;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide who sent this message'],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide who received this message'],
    },
    subject: {
      type: String,
      required: [true, 'Please provide a message subject'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide message content'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isTaskRelated: {
      type: Boolean,
      default: false,
    },
    relatedTask: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster querying
MessageSchema.index({ recipient: 1, isRead: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ createdAt: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema); 