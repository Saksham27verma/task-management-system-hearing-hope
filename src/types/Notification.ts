export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  TASK_REMINDER = 'task_reminder',
  NOTICE_CREATED = 'notice_created',
  GENERAL = 'general'
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  userId: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
} 