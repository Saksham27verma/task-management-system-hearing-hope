import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  subMonths, 
  isValid,
  parseISO
} from 'date-fns';
import { FilterQuery } from 'mongoose';
import { withAuth } from '@/lib/auth';

// GET - Get task performance reports
export async function GET(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      await connectToDatabase();
      
      // Get current user and validate permissions
      const user = await User.findById(authUser.userId);
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      
      // Only SUPER_ADMIN and MANAGER can access reports
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
        return NextResponse.json({ success: false, message: 'Unauthorized. Only managers and admins can access reports' }, { status: 403 });
      }
      
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || 'month'; // Default to month
      const roleFilter = searchParams.get('role') || '';
      const userId = searchParams.get('userId') || ''; // Filter for specific user
      const startDate = searchParams.get('startDate') || '';
      const endDate = searchParams.get('endDate') || '';
      
      // Calculate date range based on period or custom dates
      let toDate = new Date();
      let fromDate = new Date();
      let periodLabel = '';
      
      if (startDate && endDate) {
        // Custom date range
        const parsedStartDate = parseISO(startDate);
        const parsedEndDate = parseISO(endDate);
        
        if (isValid(parsedStartDate) && isValid(parsedEndDate)) {
          fromDate = parsedStartDate;
          toDate.setTime(parsedEndDate.getTime());
          toDate.setHours(23, 59, 59, 999); // End of day
          periodLabel = 'custom';
        } else {
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid date format. Please use ISO format (YYYY-MM-DD).' 
          }, { status: 400 });
        }
      } else {
        // Predefined periods
        if (period === 'week') {
          fromDate.setDate(toDate.getDate() - 7);
          periodLabel = 'last7Days';
        } else if (period === 'month') {
          // Current month (1st day of current month to today)
          fromDate = startOfMonth(toDate);
          periodLabel = 'thisMonth';
        } else if (period === 'lastMonth') {
          // Last month
          const lastMonth = subMonths(toDate, 1);
          fromDate = startOfMonth(lastMonth);
          toDate = endOfMonth(lastMonth);
          periodLabel = 'lastMonth';
        } else if (period === 'quarter') {
          fromDate.setMonth(toDate.getMonth() - 3);
          periodLabel = 'last90Days';
        } else if (period === 'year') {
          fromDate.setFullYear(toDate.getFullYear() - 1);
          periodLabel = 'last365Days';
        }
      }
      
      // Prepare user query based on user role and filters
      let userQuery: any = {};
      
      if (userId) {
        // If specific user is requested, filter to just that user
        userQuery._id = userId;
      } else {
        // Otherwise apply role-based filters
        if (user.role === 'MANAGER') {
          // Managers can only see reports for employees
          userQuery.role = 'EMPLOYEE';
          userQuery.managerId = user._id;
        } else if (user.role === 'SUPER_ADMIN') {
          // Super Admins can see both employees and managers based on filter
          if (roleFilter === 'MANAGER') {
            userQuery.role = 'MANAGER';
          } else if (roleFilter === 'EMPLOYEE') {
            userQuery.role = 'EMPLOYEE';
          } else {
            // If no filter, include both roles but exclude SUPER_ADMIN
            userQuery.role = { $in: ['MANAGER', 'EMPLOYEE'] };
          }
        }
      }
      
      // Find all users based on the query
      const users = await User.find(userQuery)
        .select('_id name email position role')
        .lean();
      
      // Get all tasks for the date range
      const taskQuery: any = {
        $or: [
          { assignedTo: { $in: users.map(u => u._id) } },
          { assignedBy: { $in: users.map(u => u._id) } },
        ],
        dueDate: { $gte: fromDate, $lte: toDate }
      };
      
      const tasks = await Task.find(taskQuery)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .lean();
      
      // Calculate report for each user
      const reports = await Promise.all(users.map(async user => {
        // Tasks assigned to this user
        const userTasks = tasks.filter(task => 
          task.assignedTo && task.assignedTo._id && task.assignedTo._id.toString() === user._id.toString()
        );
        
        // For managers, also get tasks they've assigned to others
        const tasksAssignedToOthers = user.role === 'MANAGER' ? 
          tasks.filter(task => 
            task.assignedBy && task.assignedBy._id && task.assignedBy._id.toString() === user._id.toString()
          ).length : 0;
        
        // Calculate various task statistics
        const totalTasks = userTasks.length;
        const completedTasks = userTasks.filter(task => task.status === 'COMPLETED').length;
        const pendingTasks = userTasks.filter(task => task.status === 'PENDING').length;
        const inProgressTasks = userTasks.filter(task => task.status === 'IN_PROGRESS').length;
        const incompleteOrDelayedTasks = userTasks.filter(task => {
          const pastDue = new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
          return pastDue || task.status === 'DELAYED' || task.status === 'INCOMPLETE';
        }).length;
        
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Calculate on-time completions
        const onTimeCompletions = userTasks.filter(task => {
          if (task.status !== 'COMPLETED' || !task.completedDate) return false;
          return new Date(task.completedDate) <= new Date(task.dueDate);
        }).length;
        
        const lateCompletions = completedTasks - onTimeCompletions;
        
        // Get most recent completed task
        const recentCompletedTask = userTasks
          .filter(task => task.status === 'COMPLETED' && task.completedDate)
          .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())[0];
        
        // Count tasks by type
        const dailyTasks = userTasks.filter(task => task.taskType === 'DAILY').length;
        const weeklyTasks = userTasks.filter(task => task.taskType === 'WEEKLY').length;
        const monthlyTasks = userTasks.filter(task => task.taskType === 'MONTHLY').length;
        
        return {
          employeeId: user._id,
          employeeName: user.name,
          employeeEmail: user.email,
          employeePosition: user.position,
          employeeRole: user.role,
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          incompleteOrDelayedTasks,
          completionRate,
          onTimeCompletions,
          lateCompletions,
          tasksByType: {
            daily: dailyTasks,
            weekly: weeklyTasks,
            monthly: monthlyTasks
          },
          tasksAssignedToOthers,
          recentCompletedTask: recentCompletedTask ? {
            id: recentCompletedTask._id,
            title: recentCompletedTask.title,
            completedDate: recentCompletedTask.completedDate
          } : null
        };
      }));
      
      // Calculate summary data
      const totalTasks = reports.reduce((sum, report) => sum + report.totalTasks, 0);
      const completedTasks = reports.reduce((sum, report) => sum + report.completedTasks, 0);
      const employeeCount = reports.filter(report => report.employeeRole === 'EMPLOYEE').length;
      const managerCount = reports.filter(report => report.employeeRole === 'MANAGER').length;
      
      // Format date range for response
      const dateRangeString = {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      };
      
      // Return formatted report
      return NextResponse.json({
        success: true,
        period: periodLabel || period,
        dateRange: dateRangeString,
        summary: {
          totalUsers: reports.length,
          employeeCount,
          managerCount,
          totalTasks,
          completedTasks,
          averageCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        reports: reports.sort((a, b) => b.completionRate - a.completionRate)
      });
      
    } catch (error) {
      console.error('Error generating reports:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to generate reports' },
        { status: 500 }
      );
    }
  });
} 