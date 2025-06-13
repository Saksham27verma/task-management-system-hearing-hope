import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth } from '@/lib/auth';
import { sendEmail, emailTemplates, notifyAdmins } from '@/lib/email';
import { notifyTaskCompletion } from '@/lib/whatsapp';
import User from '@/models/User';
import { addDays, addWeeks, addMonths } from 'date-fns';
import Notification from '@/models/Notification';

// Helper to create a recurring task based on the completed task
async function createRecurringTask(originalTask, user) {
  // Extract needed fields from the original task
  const {
    title,
    description,
    assignedTo,
    assignedBy,
    taskType,
    priority,
    dateRange,
    remarks
  } = originalTask;

  // Calculate the new dates for the recurring task
  let startDate = new Date();
  let dueDate;
  
  switch (taskType) {
    case 'DAILY_RECURRING':
      // Next day
      dueDate = addDays(startDate, 1);
      break;
    case 'WEEKLY_RECURRING':
      // Next week
      dueDate = addWeeks(startDate, 1);
      break;
    case 'MONTHLY_RECURRING':
      // Next month
      dueDate = addMonths(startDate, 1);
      break;
    default:
      return null; // Not a recurring task type
  }

  // Create the new task
  const newTask = new Task({
    title,
    description,
    assignedTo,
    assignedBy,
    taskType,
    priority,
    status: 'PENDING',
    startDate,
    dueDate,
    dateRange,
    remarks: `Recurring task created after completion of previous task. ${remarks || ''}`
  });

  return await newTask.save();
}

// POST /api/tasks/[id]/complete - Mark a task as complete
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the task ID from params
  const { id: taskId } = params;
  
  return withAuth(request, async (user) => {
    try {
      // Get remarks from request body (now required)
      const { remarks } = await request.json().catch(() => ({}));
      
      // Validate that remarks are provided
      if (!remarks || remarks.trim() === '') {
        return NextResponse.json(
          { success: false, message: 'Completion remarks are required' },
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
      
      // Check if user is authorized to mark this task as complete
      const isAssignedToUser = Array.isArray(task.assignedTo) 
        ? task.assignedTo.some(user => user._id.toString() === user.userId)
        : task.assignedTo._id.toString() === user.userId;
        
      if (user.role === 'EMPLOYEE' && !isAssignedToUser) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to complete this task' },
          { status: 403 }
        );
      }
      
      // Don't update if task is already completed
      if (task.status === 'COMPLETED') {
        return NextResponse.json({
          success: false,
          message: 'Task is already marked as completed'
        });
      }
      
      // Update task status and set completion date
      task.status = 'COMPLETED';
      task.completedDate = new Date();
      
      // Add remarks if provided
      if (remarks) {
        task.remarks = remarks;
      }
      
      // Save the task
      await task.save();
      
      // Get user information for notifications
      const completingUser = await User.findById(user.userId);
      const completedByName = completingUser ? completingUser.name : 'A user';
      const isSuperAdmin = completingUser && completingUser.role === 'SUPER_ADMIN';
      
      // Check if this is a recurring task type and create the next instance
      let newTaskId = null;
      const isRecurringType = ['DAILY_RECURRING', 'WEEKLY_RECURRING', 'MONTHLY_RECURRING'].includes(task.taskType);
      
      if (isRecurringType) {
        try {
          const newTask = await createRecurringTask(task, user);
          if (newTask) {
            newTaskId = newTask._id;
            
            // Notify users about the new recurring task
            if (Array.isArray(task.assignedTo)) {
              for (const assignee of task.assignedTo) {
                if (assignee.email) {
                  try {
                    await sendEmail(
                      assignee.email,
                      `New Recurring Task: ${task.title}`,
                      `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                          <h2>New Recurring Task Created</h2>
                          <p>A new recurring task has been automatically created:</p>
                          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #3aa986;">
                            <h3 style="margin-top: 0;">${task.title}</h3>
                            <p><strong>Description:</strong> ${task.description}</p>
                            <p><strong>Due Date:</strong> ${new Date(newTask.dueDate).toLocaleDateString()}</p>
                          </div>
                          <p>This task was automatically created after the completion of a previous recurring task.</p>
                          <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.NEXTAUTH_URL}/dashboard/tasks/${newTask._id}" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task</a>
                          </div>
                        </div>
                      `
                    );
                  } catch (emailError) {
                    console.error('Error sending recurring task notification:', emailError);
                  }
                }
              }
            }
          }
        } catch (recurringError) {
          console.error('Error creating recurring task:', recurringError);
          // Continue even if creating the recurring task fails
        }
      }
      
      // Send email notification to relevant parties
      try {
        // If the person completing the task is not the assignee, notify the assignee
        if (!task.assignedTo._id.toString().includes(user.userId) && task.assignedTo.email) {
          await sendEmail(
            task.assignedTo.email,
            `Task Completed: ${task.title}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2>Task Marked as Complete</h2>
                <p>The following task has been marked as complete:</p>
                <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #3aa986;">
                  <h3 style="margin-top: 0;">${task.title}</h3>
                  <p><strong>Description:</strong> ${task.description}</p>
                  <p><strong>Completed on:</strong> ${new Date().toLocaleDateString()}</p>
                  ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
                </div>
                <p>Please log in to the Hearing Hope Task Management System to view the complete details.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/tasks/${task._id}" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task</a>
                </div>
              </div>
            `
          );
        }
        
        // If the person completing is not the assigner, notify the assigner
        if (!task.assignedBy._id.toString().includes(user.userId) && task.assignedBy.email) {
          const completedBy = task.assignedTo._id.toString().includes(user.userId) 
            ? task.assignedTo.name 
            : user.role === 'SUPER_ADMIN' 
              ? 'Administrator' 
              : 'Manager';
              
          await sendEmail(
            task.assignedBy.email,
            `Task Completed: ${task.title}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2>Task Marked as Complete</h2>
                <p>The following task has been marked as complete by ${completedBy}:</p>
                <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #3aa986;">
                  <h3 style="margin-top: 0;">${task.title}</h3>
                  <p><strong>Description:</strong> ${task.description}</p>
                  <p><strong>Assigned to:</strong> ${task.assignedTo.name}</p>
                  <p><strong>Completed on:</strong> ${new Date().toLocaleDateString()}</p>
                  ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
                </div>
                <p>Please log in to the Hearing Hope Task Management System to view the complete details.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/tasks/${task._id}" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task</a>
                </div>
              </div>
            `
          );
        }
        
        // Notify super admins about task completion if needed
        if (!isSuperAdmin) {
          try {
            const assigneeName = Array.isArray(task.assignedTo) && task.assignedTo.length > 0
              ? task.assignedTo[0].name
              : typeof task.assignedTo === 'object' ? task.assignedTo.name : 'Unknown';
              
            await notifyAdmins(
              'Task Completed',
              `Task "${task.title}" assigned to ${assigneeName} has been marked as complete by ${completedByName}.${remarks ? ` Remarks: ${remarks}` : ''}`,
              completedByName,
              'View Task',
              `/dashboard/tasks/${task._id}`
            );
          } catch (adminNotifyError) {
            console.error('Error notifying admins about task completion:', adminNotifyError);
            // Continue even if notification fails
          }
        }
      } catch (emailError) {
        console.error('Error sending task completion notification:', emailError);
        // Continue even if email fails
      }
      
      return NextResponse.json({
        success: true,
        message: 'Task marked as complete successfully',
        newRecurringTaskId: newTaskId
      });
    } catch (error) {
      console.error(`Error completing task ${taskId}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to mark task as complete' },
        { status: 500 }
      );
    }
  });
} 