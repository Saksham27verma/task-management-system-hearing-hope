import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { sendEmail, emailTemplates } from '@/lib/email';
import Notification from '@/models/Notification';
import { addDays, isAfter, isBefore, parseISO } from 'date-fns';

// Default reminder periods (hours before due date)
const REMINDER_PERIODS = [24, 6, 1]; // 24 hours, 6 hours, 1 hour before deadline

export async function GET(request: NextRequest) {
  try {
    // API key validation - check both header and query parameter
    const apiKeyHeader = request.headers.get('x-api-key');
    const apiKeyQuery = request.nextUrl.searchParams.get('apiKey');
    const apiKey = apiKeyHeader || apiKeyQuery;
    const validApiKey = process.env.REMINDER_API_KEY;
    
    if (validApiKey && apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, message: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    
    // Get the current date/time
    const now = new Date();
    
    // Set the max future time to look for tasks (24 hours in the future)
    const futureLimit = addDays(now, 1);
    
    // Find tasks that are:
    // 1. Not completed
    // 2. Due within the next 24 hours
    const upcomingTasks = await Task.find({
      status: { $ne: 'COMPLETED' },
      dueDate: { 
        $gt: now,
        $lt: futureLimit
      }
    })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');
    
    const reminderResults = {
      total: upcomingTasks.length,
      sent: 0,
      errors: 0,
      tasks: [] as any[]
    };
    
    // Process each upcoming task
    for (const task of upcomingTasks) {
      try {
        const dueDate = new Date(task.dueDate);
        const hoursRemaining = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        // Only send reminders at specific hours before the deadline
        if (!REMINDER_PERIODS.includes(hoursRemaining)) {
          continue;
        }
        
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
        const taskResult = {
          taskId: task._id.toString(),
          title: task.title,
          dueDate: dueDate.toISOString(),
          hoursRemaining,
          remindersSent: 0
        };
        
        // Send reminders to each assignee
        for (const assignee of assignees) {
          if (!assignee) continue;
          
          try {
            // Create in-app notification
            const notification = new Notification({
              userId: assignee._id.toString(),
              type: 'notice',
              title: 'Task Deadline Approaching',
              message: `Your task "${task.title}" is due in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}. Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}.`,
              link: `/dashboard/tasks/${task._id}`,
              read: false,
              createdAt: new Date()
            });
            
            await notification.save();
            
            // Send email reminder
            if (assignee.email) {
              const emailTemplate = emailTemplates.taskReminder(
                assignee.name,
                task.title,
                dueDate,
                hoursRemaining > 24 ? Math.floor(hoursRemaining / 24) : hoursRemaining
              );
              
              await sendEmail(
                assignee.email,
                emailTemplate.subject,
                emailTemplate.html
              );
            }
            
            taskResult.remindersSent++;
          } catch (assigneeError) {
            console.error(`Error sending reminder to assignee ${assignee._id}:`, assigneeError);
          }
        }
        
        reminderResults.tasks.push(taskResult);
        reminderResults.sent += taskResult.remindersSent;
      } catch (taskError) {
        console.error(`Error processing task ${task._id}:`, taskError);
        reminderResults.errors++;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: reminderResults
    });
  } catch (error) {
    console.error('Error in task reminder system:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process task reminders', error: (error as Error).message },
      { status: 500 }
    );
  }
} 