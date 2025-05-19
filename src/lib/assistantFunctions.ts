import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { format, isAfter, isBefore, addDays } from 'date-fns';

/**
 * Get all overdue tasks for a user
 */
export async function getOverdueTasks(userId: string) {
  await connectToDatabase();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tasks = await Task.find({
    assignedTo: userId,
    dueDate: { $lt: today },
    status: { $nin: ['COMPLETED'] }
  })
  .populate('assignedBy', 'name')
  .sort({ dueDate: 1 })
  .lean();
  
  return tasks;
}

/**
 * Get upcoming deadlines for a user
 */
export async function getUpcomingDeadlines(userId: string, days = 7) {
  await connectToDatabase();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = addDays(today, days);
  
  const tasks = await Task.find({
    assignedTo: userId,
    dueDate: { $gte: today, $lte: endDate },
    status: { $nin: ['COMPLETED'] }
  })
  .populate('assignedBy', 'name')
  .sort({ dueDate: 1 })
  .lean();
  
  return tasks;
}

/**
 * Get user workload statistics
 */
export async function getUserWorkload(userId: string) {
  await connectToDatabase();
  
  const pendingCount = await Task.countDocuments({
    assignedTo: userId,
    status: 'PENDING'
  });
  
  const inProgressCount = await Task.countDocuments({
    assignedTo: userId,
    status: 'IN_PROGRESS'
  });
  
  const completedCount = await Task.countDocuments({
    assignedTo: userId,
    status: 'COMPLETED',
    completedDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
  });
  
  return {
    pending: pendingCount,
    inProgress: inProgressCount,
    completedLastMonth: completedCount,
    totalActive: pendingCount + inProgressCount
  };
}

/**
 * Find team members with the least workload
 */
export async function findAvailableTeamMembers() {
  await connectToDatabase();
  
  // Get all active users
  const users = await User.find({ isActive: true }).lean();
  
  // Calculate workload for each user
  const workloads = await Promise.all(
    users.map(async (user) => {
      const activeTasks = await Task.countDocuments({
        assignedTo: user._id,
        status: { $in: ['PENDING', 'IN_PROGRESS'] }
      });
      
      return {
        userId: user._id,
        name: user.name,
        position: user.position,
        activeTasks,
        role: user.role
      };
    })
  );
  
  // Sort by least active tasks
  return workloads.sort((a, b) => a.activeTasks - b.activeTasks);
}

/**
 * Get system help information
 */
export const systemHelp = {
  taskCreation: {
    title: 'Creating a Task',
    steps: [
      'Navigate to Dashboard > Tasks',
      'Click the "Create Task" button',
      'Fill in required fields: Title, Description, Due Date, and Assigned To',
      'Select task type (Daily, Weekly, Monthly, or Recurring)',
      'Set priority level',
      'Click "Create Task" to save'
    ],
    tips: [
      'For recurring tasks, specify the frequency and end date if applicable',
      'You can assign a task to multiple team members',
      'Add detailed descriptions for clarity'
    ]
  },
  
  progressUpdates: {
    title: 'Adding Progress Updates',
    steps: [
      'Open the specific task from your dashboard',
      'Scroll to the "Progress Updates" section',
      'Enter your update in the text field',
      'Click "Add Update" to save'
    ],
    tips: [
      'Be specific about what was accomplished',
      'Mention any blockers or challenges',
      'Regular updates help keep everyone informed'
    ]
  },
  
  taskCompletion: {
    title: 'Completing a Task',
    steps: [
      'Open the task you want to mark as complete',
      'Click the "Complete Task" button',
      'Add any final remarks if needed',
      'Click "Confirm" to mark as complete'
    ],
    tips: [
      'Completing a recurring task will automatically create the next occurrence',
      'All team members assigned to the task will be notified when it\'s completed'
    ]
  }
}; 