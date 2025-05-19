import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { withAuth, hasRole } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import Notification from '@/models/Notification';

// POST /api/tasks/[id]/remind - Send reminder to task assignees
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract taskId from params
  const { id: taskId } = params;
  
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Find the task with populated fields
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');
      
      if (!task) {
        return NextResponse.json(
          { success: false, message: 'Task not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission to send reminders
      // Only the task creator, managers who created the task, or admins can send reminders
      const isTaskCreator = task.assignedBy._id.toString() === user.userId;
      const isAdmin = user.role === 'SUPER_ADMIN';
      const isManagerAndCreator = user.role === 'MANAGER' && isTaskCreator;
      
      // For managers, check if this is a super admin-only task
      if (user.role === 'MANAGER') {
        // Check if all assignees are super admins
        const isAssignedToSuperAdminsOnly = Array.isArray(task.assignedTo)
          ? task.assignedTo.every(assignee => assignee?.role === 'SUPER_ADMIN')
          : task.assignedTo?.role === 'SUPER_ADMIN';
        
        // Check if assigner is a super admin
        const isAssignedBySuperAdmin = task.assignedBy?.role === 'SUPER_ADMIN';
        
        // If both conditions are true, this is a super admin-only task
        if (isAssignedToSuperAdminsOnly && isAssignedBySuperAdmin) {
          return NextResponse.json(
            { success: false, message: 'You do not have permission to send reminders for this task' },
            { status: 403 }
          );
        }
      }
      
      if (!isTaskCreator && !isAdmin && !isManagerAndCreator) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to send reminders for this task' },
          { status: 403 }
        );
      }
      
      // Don't send reminders for completed tasks
      if (task.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, message: 'Cannot send reminders for completed tasks' },
          { status: 400 }
        );
      }
      
      let successCount = 0;
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
      
      // Get reminder sender details
      const remindedBy = await User.findById(user.userId);
      const remindedByName = remindedBy ? remindedBy.name : 'Task Management System';
      
      // Send reminder to each assignee
      for (const assignee of assignees) {
        if (!assignee) continue;
        
        try {
          // 1. Create in-app notification
          const notification = new Notification({
            userId: assignee._id.toString(),
            type: 'notice', // Using 'notice' type which is a valid enum value
            title: 'Task Reminder',
            message: `Reminder: You have a task "${task.title}" that requires your attention. Due date: ${new Date(task.dueDate).toLocaleDateString()}`,
            link: `/dashboard/tasks/${task._id}`,
            read: false,
            createdAt: new Date()
          });
          
          await notification.save();
          
          // 2. Send email reminder
          if (assignee.email) {
            const emailHtml = `
              <h2>Task Reminder</h2>
              <p>Hello ${assignee.name},</p>
              <p>This is a reminder about your assigned task:</p>
              <p><strong>Title:</strong> ${task.title}</p>
              <p><strong>Description:</strong> ${task.description}</p>
              <p><strong>Due Date:</strong> ${new Date(task.dueDate).toDateString()}</p>
              <p><strong>Current Status:</strong> ${task.status}</p>
              <p><strong>Reminder sent by:</strong> ${remindedByName}</p>
              <p>Please log in to the Task Management System to update your progress.</p>
            `;
            
            await sendEmail(
              assignee.email,
              `Reminder: Task "${task.title}"`,
              emailHtml
            );
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error sending reminder to assignee ${assignee._id}:`, error);
          // Continue with other assignees even if one fails
        }
      }
      
      if (successCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Failed to send reminders to any assignees' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `Reminder sent to ${successCount} assignee(s)`,
        sentCount: successCount,
        totalAssignees: assignees.length
      });
    } catch (error) {
      console.error(`Error sending task reminder for task ${taskId}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to send task reminder' },
        { status: 500 }
      );
    }
  });
} 