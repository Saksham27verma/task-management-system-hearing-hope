import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { withPermission } from '@/lib/auth';
import Task from '@/models/Task';
import User from '@/models/User';
import Notice from '@/models/Notice';
import Message from '@/models/Message';

// GET /api/dashboard/stats - Get statistics for dashboard
export async function GET(request: NextRequest) {
  return withPermission(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Different query based on user role
      let taskQuery = {};
      let userQuery = {};
      
      if (user.role === 'EMPLOYEE') {
        // Employees can only see their own tasks
        taskQuery = { assignedTo: user.userId };
      } else if (user.role === 'MANAGER') {
        // Managers can see tasks they assigned or assigned to them
        taskQuery = {
          $or: [
            { assignedBy: user.userId },
            { assignedTo: user.userId }
          ]
        };
        
        // Managers cannot see super admins
        userQuery = { role: { $ne: 'SUPER_ADMIN' } };
      }
      
      // Current date for overdue calculation
      const now = new Date();
      
      // Task statistics
      const taskStats = {
        total: await Task.countDocuments(taskQuery),
        completed: await Task.countDocuments({ ...taskQuery, status: 'COMPLETED' }),
        inProgress: await Task.countDocuments({ ...taskQuery, status: 'IN_PROGRESS' }),
        pending: await Task.countDocuments({ ...taskQuery, status: 'PENDING' }),
        overdue: await Task.countDocuments({ 
          ...taskQuery, 
          status: { $nin: ['COMPLETED'] },
          dueDate: { $lt: now }
        })
      };
      
      // Get upcoming tasks (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const upcomingTasks = await Task.find({
        ...taskQuery,
        status: { $nin: ['COMPLETED'] },
        dueDate: { $gte: now, $lte: nextWeek }
      })
      .populate('assignedTo', 'name')
      .populate('assignedBy', 'name')
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();
      
      // User statistics (for SUPER_ADMIN and MANAGER only)
      let userStats = {};
      let recentUsers = [];
      
      if (user.role !== 'EMPLOYEE') {
        userStats = {
          total: await User.countDocuments(userQuery),
          active: await User.countDocuments({ ...userQuery, isActive: true }),
          managers: await User.countDocuments({ ...userQuery, role: 'MANAGER', isActive: true }),
          employees: await User.countDocuments({ ...userQuery, role: 'EMPLOYEE', isActive: true })
        };
        
        // Get recent users
        recentUsers = await User.find(userQuery)
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name email role position createdAt')
          .lean();
      }
      
      // Recent notices
      const recentNotices = await Notice.find({})
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      
      // Unread messages count
      const unreadMessages = await Message.countDocuments({
        recipient: user.userId,
        isRead: false
      });
      
      // Return the stats
      return NextResponse.json({
        success: true,
        taskStats,
        upcomingTasks,
        userStats,
        recentUsers,
        recentNotices,
        unreadMessages
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch dashboard statistics' },
        { status: 500 }
      );
    }
  }, 'reports:read'); // Specify the required permission for accessing dashboard stats
} 