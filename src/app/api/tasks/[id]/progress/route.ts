import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth } from '@/lib/auth';
import { sendEmail, emailTemplates, notifyAdmins } from '@/lib/email';
import User from '@/models/User';
import { formatDateHuman } from '@/utils/dates';
import { format, isValid, isSameDay, getDay, addDays } from 'date-fns';
import Notification from '@/models/Notification';

// POST /api/tasks/[id]/progress - Add progress update to a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the task ID from params
  const { id: taskId } = params;
  
  return withAuth(request, async (user) => {
    try {
      const { progress, date } = await request.json();
      
      // Validate request body
      if (!progress) {
        return NextResponse.json(
          { success: false, message: 'Progress update content is required' },
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
      
      // Check if user is assigned to this task or is a manager/admin
      let isAssignedUser = false;
      
      if (Array.isArray(task.assignedTo)) {
        // If assignedTo is an array, check if user is in the array
        isAssignedUser = task.assignedTo.some(assignee => 
          assignee._id.toString() === user.userId
        );
      } else {
        // If assignedTo is a single object
        isAssignedUser = task.assignedTo._id.toString() === user.userId;
      }
      
      if (!isAssignedUser && user.role === 'EMPLOYEE') {
        return NextResponse.json(
          { success: false, message: 'Not authorized to update this task' },
          { status: 403 }
        );
      }
      
      // Parse the date if provided, otherwise use current date
      let updateDate = new Date();
      try {
        if (date) {
          updateDate = new Date(date);
          
          // Validate date format
          if (!isValid(updateDate)) {
            return NextResponse.json(
              { success: false, message: 'Invalid date format' },
              { status: 400 }
            );
          }
        }
      } catch (e) {
        console.error('Invalid date format:', e);
        return NextResponse.json(
          { success: false, message: 'Invalid date format' },
          { status: 400 }
        );
      }
      
      // Check if the update date is on a Sunday and if Sundays are excluded
      const isSunday = getDay(updateDate) === 0; // 0 represents Sunday in JavaScript
      if (isSunday && task.dateRange && task.dateRange.includeSundays === false) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'This task is configured to exclude Sundays. Progress updates cannot be added on Sundays.'
          },
          { status: 400 }
        );
      }
      
      // Check if employee already added a progress update for this day
      if (user.role === 'EMPLOYEE') {
        const alreadyUpdatedToday = task.progressUpdates.some(update => 
          update.updatedBy.toString() === user.userId && 
          isSameDay(new Date(update.date), updateDate)
        );
        
        if (alreadyUpdatedToday) {
          return NextResponse.json(
            { success: false, message: 'You have already added a progress update for this day' },
            { status: 400 }
          );
        }
      }
      
      // Create a new progress update
      const progressUpdate = {
        date: updateDate,
        progress,
        updatedBy: user.userId
      };
      
      // Add to progress updates array
      task.progressUpdates.push(progressUpdate);
      
      // Update status if currently PENDING
      if (task.status === 'PENDING') {
        task.status = 'IN_PROGRESS';
      }
      
      // Save the task
      await task.save();
      
      // Get user information for notifications
      const userMakingUpdate = await User.findById(user.userId);
      const userName = userMakingUpdate ? userMakingUpdate.name : 'A user';
      
      // Format the date for display in the email
      const formattedDate = formatDateHuman(updateDate);
      
      // Get the custom formatted date based on task type
      let customDateInfo = '';
      if (task.taskType === 'DAILY') {
        customDateInfo = `Daily Task - ${formattedDate}`;
      } else if (task.taskType === 'WEEKLY') {
        customDateInfo = `Weekly Task - Week of ${format(updateDate, 'MMM d, yyyy')}`;
      } else if (task.taskType === 'MONTHLY') {
        customDateInfo = `Monthly Task - Month of ${format(updateDate, 'MMMM yyyy')}`;
      } else if (task.taskType === 'DAILY_RECURRING') {
        customDateInfo = `Daily Recurring Task - ${formattedDate}`;
      } else if (task.taskType === 'WEEKLY_RECURRING') {
        customDateInfo = `Weekly Recurring Task - Week of ${format(updateDate, 'MMM d, yyyy')}`;
      } else if (task.taskType === 'MONTHLY_RECURRING') {
        customDateInfo = `Monthly Recurring Task - Month of ${format(updateDate, 'MMMM yyyy')}`;
      }
      
      // Notify task assigner about the progress update
      try {
        const assignerUser = await User.findById(task.assignedBy);
        
        if (
          assignerUser && 
          assignerUser.email && 
          assignerUser._id.toString() !== user.userId
        ) {
          // Create a simple email about the progress update
          await sendEmail(
            assignerUser.email,
            `Progress Update for Task: ${task.title}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2>Task Progress Update</h2>
                <p>${userName} has added a progress update to the task "${task.title}":</p>
                <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #3aa986;">
                  <p><strong>Update:</strong> ${progress}</p>
                  <p><strong>Date:</strong> ${formattedDate}</p>
                  <p><strong>Task Period:</strong> ${customDateInfo}</p>
                </div>
                <p>Please log in to the Hearing Hope Task Management System to view the complete details.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/tasks/${task._id}" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task</a>
                </div>
              </div>
            `
          );
        }
      } catch (emailError) {
        console.error('Error sending progress update notification:', emailError);
        // Continue even if email fails
      }
      
      // Notify all super admins about the progress update
      try {
        await notifyAdmins(
          'Task Progress Update',
          `Task '${task.title}' has a new progress update: ${progress.substring(0, 100)}${progress.length > 100 ? '...' : ''}`,
          userName,
          'View Task',
          `/dashboard/tasks/${task._id}`
        );
      } catch (adminNotifyError) {
        console.error('Error notifying admins about progress update:', adminNotifyError);
        // Continue even if notification fails
      }
      
      return NextResponse.json({
        success: true,
        message: 'Progress update added successfully'
      });
    } catch (error) {
      console.error(`Error adding progress update to task ${taskId}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to add progress update' },
        { status: 500 }
      );
    }
  });
} 