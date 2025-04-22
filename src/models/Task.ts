import mongoose, { Schema, Document, Types } from 'mongoose';

export type TaskType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'INCOMPLETE';

export interface IProgressUpdate {
  date: Date;
  progress: string;
  updatedBy: Types.ObjectId;
}

export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: Types.ObjectId[] | Types.ObjectId;
  assignedBy: Types.ObjectId;
  taskType: TaskType;
  status: TaskStatus;
  startDate: Date;
  dueDate: Date;
  dateRange: {
    days: string[];
    specificDates?: Date[];
  };
  remarks?: string;
  progressUpdates: IProgressUpdate[];
  completedDate?: Date;
  googleCalendarEventId?: string;
}

const ProgressUpdateSchema = new Schema<IProgressUpdate>({
  date: {
    type: Date,
    default: Date.now,
  },
  progress: {
    type: String,
    required: [true, 'Please provide progress update'],
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide who updated this progress'],
  },
});

const DateRangeSchema = new Schema({
  days: [String],
  specificDates: [Date]
});

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    assignedTo: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      required: [true, 'Please provide who this task is assigned to'],
      validate: {
        validator: function(v: any) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one user must be assigned to the task'
      }
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide who assigned this task'],
    },
    taskType: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
      required: [true, 'Please provide task type'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'INCOMPLETE'],
      default: 'PENDING',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide due date'],
    },
    dateRange: {
      type: DateRangeSchema,
      default: { days: [] }
    },
    remarks: {
      type: String,
    },
    progressUpdates: [ProgressUpdateSchema],
    completedDate: {
      type: Date,
    },
    googleCalendarEventId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster querying
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ startDate: 1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema); 