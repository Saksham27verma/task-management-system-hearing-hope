import { useNotifications } from '@/contexts/NotificationContext';

export const useNotificationManager = () => {
  const { addNotification } = useNotifications();

  // Notify about a new task
  const notifyNewTask = (task: any) => {
    addNotification({
      type: 'task',
      title: 'New Task Assigned',
      message: `${task.title} is assigned to you. Due ${new Date(task.dueDate).toLocaleDateString()}.`,
      link: `/dashboard/tasks/${task._id}`
    });
  };

  // Notify about a task status change
  const notifyTaskStatusChange = (task: any, previousStatus: string) => {
    addNotification({
      type: 'status',
      title: 'Task Status Updated',
      message: `Task "${task.title}" changed from ${previousStatus} to ${task.status}.`,
      link: `/dashboard/tasks/${task._id}`
    });
  };

  // Notify about task completion
  const notifyTaskComplete = (task: any) => {
    addNotification({
      type: 'task',
      title: 'Task Completed',
      message: `Task "${task.title}" has been marked as complete.`,
      link: `/dashboard/tasks/${task._id}`
    });
  };

  // Notify about a new notice
  const notifyNewNotice = (notice: any) => {
    addNotification({
      type: 'notice',
      title: 'New Notice Posted',
      message: notice.title,
      link: `/dashboard/notices`
    });
  };

  // Used for admin notifications about new tasks created
  const notifyAdminNewTask = (task: any, createdBy: string) => {
    addNotification({
      type: 'task',
      title: 'New Task Created',
      message: `${createdBy} created a new task: ${task.title}`,
      link: `/dashboard/tasks/${task._id}`
    });
  };

  // Used for admin notifications about task assignments
  const notifyAdminTaskAssigned = (task: any, assignedTo: string | string[]) => {
    const assigneeText = Array.isArray(assignedTo) 
      ? `${assignedTo.length} employees` 
      : assignedTo;
    
    addNotification({
      type: 'task',
      title: 'Task Assignment',
      message: `Task "${task.title}" assigned to ${assigneeText}`,
      link: `/dashboard/tasks/${task._id}`
    });
  };

  return {
    notifyNewTask,
    notifyTaskStatusChange,
    notifyTaskComplete,
    notifyNewNotice,
    notifyAdminNewTask,
    notifyAdminTaskAssigned
  };
}; 