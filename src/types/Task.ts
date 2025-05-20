import { Types } from 'mongoose';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'DAILY_RECURRING' | 'WEEKLY_RECURRING' | 'MONTHLY_RECURRING';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdBy: string;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  dueDate: Date;
  taskType?: TaskType;
  dateRange?: {
    includeSundays?: boolean;
  };
  remarks?: string;
} 