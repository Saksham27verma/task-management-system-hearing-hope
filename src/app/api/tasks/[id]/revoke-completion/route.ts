import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth } from '@/lib/auth';
import { sendEmail, emailTemplates, notifyAdmins } from '@/lib/email';
import User from '@/models/User';
import Notification from '@/models/Notification';

// POST /api/tasks/[id]/revoke-completion - Mark a completed task as incomplete (Super Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the task ID from params
  const { id: taskId } = params;
  
  return withAuth(request, async (user) => {
    try {
      // Check if user is a super admin
      if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, message: 'Only Super Admins can revoke completion status' },
          { status: 403 }
        );
      }
      
      // Get reason from request body (required)
      const { reason } = await request.json().catch(() => ({}));
      
      // Validate that reason is provided
      if (!reason || reason.trim() === '') {
        return NextResponse.json(
          { success: false, message: 'Reason for revoking completion is required' },
          { status: 400 }
        );
      }
      
      await connectToDatabase();
      
      // Find the task
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');
      
      if (!task) {
        return NextResponse.json(
          { success: false, message: 'Task not found' },
          { status: 404 }
        );
      }
      
      // Check if task is actually completed
      if (task.status !== 'COMPLETED') {
        return NextResponse.json({
          success: false,
          message: 'Task is not marked as completed'
        });
      }
      
      // Store the previous completion remarks
      const previousRemarks = task.remarks;
      
      // Update task status and add new remarks
      task.status = 'IN_PROGRESS';
      task.remarks = `[COMPLETION REVOKED BY ADMIN] ${reason}\n\nPrevious completion remarks: ${previousRemarks}`;
      
      // Clear completion date
      task.completedDate = undefined;
      
      // Add a progress update for the revocation
      task.progressUpdates.push({
        date: new Date(),
        progress: `Task completion has been revoked by admin. Reason: ${reason}`,
        updatedBy: user.userId
      });
      
      // Save the task
      await task.save();
      
      // Get admin user information for notifications
      const adminUser = await User.findById(user.userId);
      const adminName = adminUser ? adminUser.name : 'A Super Admin';
      
      // Notify all task assignees
      try {
        if (Array.isArray(task.assignedTo)) {
          // Create notifications for all assignees
          const notifications = [];
          
          for (const assignee of task.assignedTo) {
            if (!assignee) continue;
            
            // Create in-app notification
            notifications.push({
              user: assignee._id,
              type: 'task_update',
              title: 'Task Completion Revoked',
              message: `The task "${task.title}" has been marked as incomplete by ${adminName}. Reason: ${reason}`,
              link: `/dashboard/tasks/${task._id}`,
              read: false
            });
            
            // Send email notification
            if (assignee.email) {
              await sendEmail(
                assignee.email,
                `Task Completion Revoked: ${task.title}`,
                `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h2>Task Completion Status Has Been Revoked</h2>
                    <p>The following task was previously marked as complete but has been changed to "In Progress" status:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336;">
                      <h3 style="margin-top: 0;">${task.title}</h3>
                      <p><strong>Description:</strong> ${task.description}</p>
                      <p><strong>Reason for change:</strong> ${reason}</p>
                    </div>
                    <p>Please log in to the Hearing Hope Task Management System to continue working on this task.</p>
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${process.env.NEXTAUTH_URL}/dashboard/tasks/${task._id}" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task</a>
                    </div>
                  </div>
                `
              );
            }
          }
          
          // Insert all notifications at once
          if (notifications.length > 0) {
            await Notification.insertMany(notifications);
          }
        }
        
        // Also notify the person who assigned the task (if different from admin)
        if (task.assignedBy && task.assignedBy._id.toString() !== user.userId && task.assignedBy.email) {
          await sendEmail(
            task.assignedBy.email,
            `Task Completion Revoked: ${task.title}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2>Task Completion Status Has Been Revoked</h2>
                <p>The following task you assigned was previously marked as complete but has been changed to "In Progress" status by ${adminName}:</p>
                <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336;">
                  <h3 style="margin-top: 0;">${task.title}</h3>
                  <p><strong>Description:</strong> ${task.description}</p>
                  <p><strong>Reason for change:</strong> ${reason}</p>
                </div>
                <p>Please log in to the Hearing Hope Task Management System for more details.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/tasks/${task._id}" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task</a>
                </div>
              </div>
            `
          );
        }
      } catch (notifyError) {
        console.error('Error sending task revocation notifications:', notifyError);
        // Continue even if notifications fail
      }
      
      return NextResponse.json({
        success: true,
        message: 'Task completion has been revoked successfully'
      });
    } catch (error) {
      console.error(`Error revoking task completion ${taskId}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to revoke task completion' },
        { status: 500 }
      );
    }
  });
} 