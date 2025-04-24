import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  subWeeks,
  addDays,
  startOfWeek,
  endOfWeek,
  parseISO,
  isValid
} from 'date-fns';
import { withAuth } from '@/lib/auth';

// GET - Get analytics data for dashboard
export async function GET(request: NextRequest) {
  // For development environment, handle the request directly without auth middleware
  if (process.env.NODE_ENV === 'development') {
    return handleAnalyticsRequest(request);
  }
  
  // For production, use the auth middleware
  return withAuth(request, async (authUser) => {
    return handleAnalyticsRequest(request, authUser);
  }, 'reports:read');
}

// Separate function to handle analytics requests
async function handleAnalyticsRequest(request: NextRequest, authUser?: any) {
  try {
    const { db } = await connectToDatabase();
    
    // Skip permission check in development mode
    if (process.env.NODE_ENV !== 'development' && authUser) {
      // Get current user and validate permissions
      const userId = typeof authUser.userId === 'string' ? new ObjectId(authUser.userId) : authUser.userId;
      const user = await db.collection('users').findOne({ _id: userId });
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      
      // Only SUPER_ADMIN and MANAGER can access analytics
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
        return NextResponse.json({ 
          success: false, 
          message: 'Unauthorized. Only managers and admins can access analytics data' 
        }, { status: 403 });
      }
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // Default to month
    const roleFilter = searchParams.get('role') || '';
    
    // Calculate date range based on period
    const now = new Date();
    let toDate = new Date();
    let fromDate = new Date();
    
    // Determine date range based on period
    if (period === 'week') {
      fromDate = startOfWeek(now);
      toDate = endOfWeek(now);
    } else if (period === 'month') {
      fromDate = startOfMonth(now);
    } else if (period === 'quarter') {
      fromDate.setMonth(toDate.getMonth() - 3);
    } else if (period === 'year') {
      fromDate.setFullYear(toDate.getFullYear() - 1);
    } else if (period === 'lastMonth') {
      const lastMonth = subMonths(now, 1);
      fromDate = startOfMonth(lastMonth);
      toDate = endOfMonth(lastMonth);
    }
    
    // Prepare user query based on role filter
    let userQuery: any = {
      isActive: true
    };
    
    if (roleFilter) {
      userQuery.role = roleFilter;
    } else {
      // If no role filter is specified, exclude SUPER_ADMIN
      userQuery.role = { $ne: 'SUPER_ADMIN' };
    }
    
    // Get all tasks within the date range
    const taskQuery: any = {
      $or: [
        { startDate: { $gte: fromDate, $lte: toDate } },
        { dueDate: { $gte: fromDate, $lte: toDate } },
        { completedDate: { $gte: fromDate, $lte: toDate } }
      ]
    };
    
    const tasks = await db.collection('tasks').find(taskQuery).toArray();
    
    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(task => task.status === 'PENDING').length;
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
    const delayedTasks = tasks.filter(task => task.status === 'DELAYED').length;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate on-time completion rate
    const onTimeCompletions = tasks.filter(task => {
      if (task.status !== 'COMPLETED' || !task.completedDate) return false;
      return new Date(task.completedDate) <= new Date(task.dueDate);
    }).length;
    
    const onTimeRate = completedTasks > 0 ? (onTimeCompletions / completedTasks) * 100 : 0;
    
    // Tasks by priority (assuming priority is stored in the task)
    const tasksByPriority: Record<string, number> = {
      'High': tasks.filter(task => task.priority === 'HIGH').length,
      'Medium': tasks.filter(task => task.priority === 'MEDIUM').length,
      'Low': tasks.filter(task => task.priority === 'LOW').length
    };
    
    // Tasks by type
    const tasksByType: Record<string, number> = {
      'Daily': tasks.filter(task => task.taskType === 'DAILY').length,
      'Weekly': tasks.filter(task => task.taskType === 'WEEKLY').length,
      'Monthly': tasks.filter(task => task.taskType === 'MONTHLY').length
    };
    
    // Tasks by status
    const tasksByStatus: Record<string, number> = {
      'Completed': completedTasks,
      'In Progress': inProgressTasks,
      'Pending': pendingTasks,
      'Delayed': delayedTasks
    };
    
    // Calculate task completion by week
    const taskCompletionByWeek: Record<string, number> = {};
    const taskCreationByWeek: Record<string, number> = {};
    
    // Determine the number of weeks to include based on the period
    let weekCount = 4; // Default for month
    if (period === 'week') weekCount = 1;
    if (period === 'quarter') weekCount = 12;
    if (period === 'year') weekCount = 26; // Show bi-weekly for year
    
    // Create week labels and initialize counters
    for (let i = 0; i < weekCount; i++) {
      const weekStart = subWeeks(toDate, weekCount - i - 1);
      const weekEnd = subWeeks(toDate, weekCount - i - 2);
      const weekLabel = `Week ${i + 1}`;
      
      // Count tasks completed in this week
      const weeklyCompletedCount = tasks.filter(task => {
        if (!task.completedDate) return false;
        const completedDate = new Date(task.completedDate);
        return completedDate >= weekStart && completedDate < weekEnd;
      }).length;
      
      // Count tasks created in this week
      const weeklyCreatedCount = tasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        return createdDate >= weekStart && createdDate < weekEnd;
      }).length;
      
      taskCompletionByWeek[weekLabel] = weeklyCompletedCount;
      taskCreationByWeek[weekLabel] = weeklyCreatedCount;
    }
    
    // Calculate average completion time (in days)
    let totalCompletionDays = 0;
    let completedTasksWithDates = 0;
    
    tasks.forEach(task => {
      if (task.status === 'COMPLETED' && task.completedDate && task.startDate) {
        const startDate = new Date(task.startDate);
        const completedDate = new Date(task.completedDate);
        const days = Math.round((completedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        totalCompletionDays += days;
        completedTasksWithDates++;
      }
    });
    
    const avgCompletionTime = completedTasksWithDates > 0 ? 
      totalCompletionDays / completedTasksWithDates : 0;
    
    // Get user productivity data
    const users = await db.collection('users').find(userQuery).toArray();
    
    const userProductivity: Record<string, { completed: number, assigned: number }> = {};
    
    for (const user of users) {
      const userName = user.name;
      const userObjectId = user._id.toString();
      
      const assignedTasks = tasks.filter(task => {
        if (!task.assignedTo) return false;
        if (Array.isArray(task.assignedTo)) {
          return task.assignedTo.some(assignee => {
            const assigneeId = typeof assignee === 'object' ? assignee.toString() : assignee;
            return assigneeId === userObjectId;
          });
        }
        const taskAssignedId = typeof task.assignedTo === 'object' ? task.assignedTo.toString() : task.assignedTo;
        return taskAssignedId === userObjectId;
      }).length;
      
      const userCompletedTasks = tasks.filter(task => {
        if (task.status !== 'COMPLETED') return false;
        if (!task.assignedTo) return false;
        if (Array.isArray(task.assignedTo)) {
          return task.assignedTo.some(assignee => {
            const assigneeId = typeof assignee === 'object' ? assignee.toString() : assignee;
            return assigneeId === userObjectId;
          });
        }
        const taskAssignedId = typeof task.assignedTo === 'object' ? task.assignedTo.toString() : task.assignedTo;
        return taskAssignedId === userObjectId;
      }).length;
      
      userProductivity[userName] = {
        assigned: assignedTasks,
        completed: userCompletedTasks
      };
    }
    
    // Compile all analytics data
    const analyticsData = {
      totalTasks,
      completedTasks,
      pendingTasks, 
      inProgressTasks,
      delayedTasks,
      completionRate,
      onTimeRate,
      tasksByPriority,
      tasksByType,
      taskCompletionByWeek,
      taskCreationByWeek,
      tasksByStatus,
      avgCompletionTime,
      userProductivity
    };
    
    return NextResponse.json({
      success: true,
      message: 'Analytics data fetched successfully',
      period,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      },
      data: analyticsData
    });
    
  } catch (error) {
    console.error('Error generating analytics data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate analytics data', error: String(error) },
      { status: 500 }
    );
  }
} 