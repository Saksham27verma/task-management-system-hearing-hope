import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const url = new URL(request.url);
      const assignment = url.searchParams.get('assignment');
      
      // Connect to database
      await connectToDatabase();
      
      // Build query
      const query: any = {};
      
      // Handle assignment filter
      if (assignment) {
        if (assignment === 'assignedToMe') {
          // Show only tasks assigned to the current user
          query.assignedTo = user.userId;
        } else if (assignment === 'assignedByMe') {
          // Show only tasks assigned by the current user
          query.assignedBy = user.userId;
        }
      } else {
        // Apply role-based filters if no specific assignment filter
        if (user.role === 'EMPLOYEE') {
          // Employees can only see their own tasks
          query.assignedTo = user.userId;
        } else if (user.role === 'MANAGER') {
          // Managers can see tasks they assigned or tasks assigned to them
          query.$or = [
            { assignedBy: user.userId },
            { assignedTo: user.userId }
          ];
        }
        // Super admins can see all tasks, so no filter needed
      }
      
      // Current date for overdue calculation
      const now = new Date();
      
      // Calculate task counts
      const total = await Task.countDocuments(query);
      const pending = await Task.countDocuments({ ...query, status: 'PENDING' });
      const inProgress = await Task.countDocuments({ ...query, status: 'IN_PROGRESS' });
      const completed = await Task.countDocuments({ ...query, status: 'COMPLETED' });
      const overdue = await Task.countDocuments({
        ...query,
        status: { $nin: ['COMPLETED'] },
        dueDate: { $lt: now }
      });
      
      // Return task summary
      return NextResponse.json({
        success: true,
        summary: {
          total,
          pending,
          inProgress,
          completed,
          overdue
        }
      });
      
    } catch (error) {
      console.error('Error fetching task summary:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch task summary' },
        { status: 500 }
      );
    }
  });
} 