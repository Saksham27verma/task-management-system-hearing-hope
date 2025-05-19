import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const url = new URL(request.url);
      const assignment = url.searchParams.get('assignment');
      
      // Connect to database
      await connectToDatabase();
      
      // Build query
      const query: any = {};
      
      // Find super admin users for potential filtering
      let superAdminIds: string[] = [];
      if (user.role === 'MANAGER') {
        const superAdminUsers = await User.find({ role: 'SUPER_ADMIN' }).select('_id').lean();
        superAdminIds = superAdminUsers.map(admin => admin._id.toString());
      }
      
      console.log("User role:", user.role);
      console.log("Assignment filter:", assignment);
      
      // Handle assignment filter
      if (assignment) {
        if (assignment === 'assignedToMe') {
          // Show only tasks assigned to the current user
          query.assignedTo = user.userId;
          
          // For managers, only exclude tasks where BOTH:
          // 1. The assigner is a super admin AND
          // 2. All assignees are super admins
          // This ensures managers still see tasks assigned to them by super admins
          // unless those tasks are super-admin only tasks
          if (user.role === 'MANAGER' && superAdminIds.length > 0) {
            // Add a filter to exclude tasks where the assigner is a super admin AND all other
            // assignees (besides this manager) are also super admins
            if (!query.$and) query.$and = [];
            
            query.$and.push({
              $or: [
                // Either the assignedBy is NOT a super admin
                { assignedBy: { $nin: superAdminIds } },
                // OR at least one assignee is NOT a super admin
                // We don't need $elemMatch here since we're already filtering for tasks
                // where the current user is an assignee
                { assignedTo: { $nin: superAdminIds } }
              ]
            });
          }
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
          
          // Add exclusion for tasks where both assignedBy and assignedTo are super admins
          if (superAdminIds.length > 0) {
            // First, add the exclusion to the query
            if (!query.$and) query.$and = [];
            
            // For tasks assigned to the current manager, we need a more nuanced filter
            // to handle the case where the manager is the only non-super-admin assignee
            query.$and.push({
              $or: [
                // Either the assignedBy is NOT a super admin
                { assignedBy: { $nin: superAdminIds } },
                // OR at least one assignedTo is NOT a super admin
                { assignedTo: { $nin: superAdminIds } }
              ]
            });
          }
        }
        // Super admins can see all tasks, so no filter needed
      }
      
      console.log("Final query:", JSON.stringify(query, null, 2));
      
      // Current date for overdue calculation
      const now = new Date();
      
      // Calculate task counts
      const total = await Task.countDocuments(query);
      console.log("Total tasks found:", total);
      
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