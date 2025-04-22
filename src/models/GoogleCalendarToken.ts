import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGoogleCalendarToken extends Document {
  userId: Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  lastSyncTime: Date;
  syncSettings: {
    taskTypes: string[];
    syncFrequency: string;
  };
}

const GoogleCalendarTokenSchema = new Schema<IGoogleCalendarToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: [true, 'Access token is required'],
    },
    refreshToken: {
      type: String,
      required: [true, 'Refresh token is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Token expiry date is required'],
    },
    lastSyncTime: {
      type: Date,
      default: Date.now,
    },
    syncSettings: {
      taskTypes: {
        type: [String],
        enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
        default: ['DAILY', 'WEEKLY', 'MONTHLY'],
      },
      syncFrequency: {
        type: String,
        enum: ['realtime', 'hourly', 'daily', 'manual'],
        default: 'daily',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create an index on syncFrequency for faster filtering of realtime sync users
GoogleCalendarTokenSchema.index({ 'syncSettings.syncFrequency': 1 });

export default mongoose.models.GoogleCalendarToken || 
  mongoose.model<IGoogleCalendarToken>('GoogleCalendarToken', GoogleCalendarTokenSchema); 