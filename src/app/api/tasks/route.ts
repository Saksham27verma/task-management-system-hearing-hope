import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth, hasRole } from '@/lib/auth';
import { sendEmail, emailTemplates } from '@/lib/email';
import User from '@/models/User';
import GoogleCalendarToken from '@/models/GoogleCalendarToken';
import { createTaskEvent, getValidAccessToken } from '@/services/googleCalendar';
import { withPermission } from '@/lib/auth';

// GET /api/tasks - Get all tasks (with filtering)
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const url = new URL(request.url);
    
    // Parse query parameters
    const status = url.searchParams.get('status');
    const taskType = url.searchParams.get('taskType');
    const searchQuery = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Connect to database
    await connectToDatabase();
    
    // Build query
    const query: any = {};
    
    // Apply role-based filters
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
    
    // Apply status filter
    if (status) {
      query.status = status;
    }
    
    // Apply task type filter
    if (taskType) {
      query.taskType = taskType;
    }
    
    // Apply search filter
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    try {
      // Get total count for pagination
      const total = await Task.countDocuments(query);
      
      // Get tasks with pagination
      const tasks = await Task.find(query)
        .populate('assignedTo', 'name')
        .populate('assignedBy', 'name')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit);
      
      return NextResponse.json({
        success: true,
        tasks,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }
  });
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  // Use the new permission-based middleware instead of role-based
  return withPermission(request, async (user) => {
    try {
      const {
        title,
        description,
        assignedTo,
        taskType,
        dueDate,
        remarks
      } = await request.json();
      
      // Validate required fields
      if (!title || !description || !assignedTo || !taskType || !dueDate) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Validate that assignedTo is an array and not empty
      if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
        return NextResponse.json(
          { success: false, message: 'At least one user must be assigned to the task' },
          { status: 400 }
        );
      }
      
      // Connect to database
      await connectToDatabase();
      
      // Create new task
      const newTask = new Task({
        title,
        description,
        assignedTo, // This is now an array of user IDs
        assignedBy: user.userId,
        taskType,
        status: 'PENDING',
        dueDate: new Date(dueDate),
        remarks,
        progressUpdates: []
      });
      
      // Save task to database
      await newTask.save();
      
      // Send email notifications to assigned users
      try {
        // Get assigner details for the email
        const assignerUser = await User.findById(user.userId);
        const assignerName = assignerUser ? assignerUser.name : 'Administrator';
        
        // Prepare email details
        const dueDateFormatted = new Date(dueDate);
        
        // Send email to each assigned user
        for (const userId of assignedTo) {
          const assignedUser = await User.findById(userId);
          
          if (assignedUser && assignedUser.email) {
            const emailTemplate = emailTemplates.taskAssigned(
              assignedUser.name,
              title,
              description,
              dueDateFormatted,
              assignerName
            );
            
            await sendEmail(
              assignedUser.email,
              emailTemplate.subject,
              emailTemplate.html
            );
          }
        }
      } catch (emailError) {
        console.error('Error sending task assignment emails:', emailError);
        // Continue even if email sending fails
      }
      
      // After successfully creating the task, check if users have Google Calendar
      try {
        // Fetch the full task with populated fields for proper syncing
        const populatedTask = await Task.findById(newTask._id)
          .populate('assignedTo', 'name email')
          .populate('assignedBy', 'name email')
          .lean();
          
        // For each assigned user, check if they have Google Calendar connected
        for (const userId of assignedTo) {
          // Check if the assignee has Google Calendar connected with real-time sync
          const tokenRecord = await GoogleCalendarToken.findOne({ 
            userId: userId.toString(),
            'syncSettings.syncFrequency': 'realtime'
          }).lean();
          
          // If connected and real-time sync is enabled, sync to Google Calendar
          if (tokenRecord && tokenRecord.syncSettings.taskTypes.includes(taskType)) {
            try {
              // Get a valid access token (will refresh if expired)
              const validAccessToken = await getValidAccessToken(userId.toString());
              
              if (!validAccessToken) {
                console.error('Could not get a valid access token for Google Calendar sync');
                continue; // Skip this user and try the next one
              }
              
              // We still create events during initial task creation
              const eventResult = await createTaskEvent(validAccessToken, populatedTask);
              
              // Store the event ID in the task - for the first user only
              // We may need to extend this to store multiple event IDs in the future
              if (eventResult && eventResult.id && !newTask.googleCalendarEventId) {
                newTask.googleCalendarEventId = eventResult.id;
                await newTask.save();
              }
            } catch (syncError) {
              // Log error but don't affect the main task creation response
              console.error(`Error syncing new task to Google Calendar for user ${userId}:`, syncError);
            }
          }
        }
      } catch (calendarError) {
        // Log error but don't affect the main task creation response
        console.error('Error checking Google Calendar connection:', calendarError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Task created successfully',
        taskId: newTask._id
      });
    } catch (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create task' },
        { status: 500 }
      );
    }
  }, 'tasks:create'); // Required permission for creating tasks
} 