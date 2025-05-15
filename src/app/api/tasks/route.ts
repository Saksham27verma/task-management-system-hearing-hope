import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth, hasRole } from '@/lib/auth';
import { sendEmail, emailTemplates, notifyAdmins } from '@/lib/email';
import User from '@/models/User';
import GoogleCalendarToken from '@/models/GoogleCalendarToken';
import { createTaskEvent, getValidAccessToken } from '@/services/googleCalendar';
import { withPermission } from '@/lib/auth';
import Notification from '@/models/Notification';

// GET /api/tasks - Get all tasks (with filtering)
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const url = new URL(request.url);
    
    // Parse query parameters
    const status = url.searchParams.get('status');
    const taskType = url.searchParams.get('taskType');
    const searchQuery = url.searchParams.get('search');
    const assignment = url.searchParams.get('assignment');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Connect to database
    await connectToDatabase();
    
    // Build query
    const query: any = {};
    
    // Handle assignment filter (this takes precedence over role-based filters)
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
      
      // Get assigner details for notifications
      const assignerUser = await User.findById(user.userId);
      const assignerName = assignerUser ? assignerUser.name : 'Administrator';
      const isAssignerSuperAdmin = assignerUser && assignerUser.role === 'SUPER_ADMIN';
      
      // Prepare email details
      const dueDateFormatted = new Date(dueDate);
      
      // Send email notifications to assigned users
      try {
        // Send email to each assigned user
        const assignedUserNames = [];
        
        for (const userId of assignedTo) {
          const assignedUser = await User.findById(userId);
          
          if (assignedUser) {
            assignedUserNames.push(assignedUser.name);
            
            if (assignedUser.email) {
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
              
              // Send in-app notification to the assigned user
              try {
                // Directly create notification instead of using fetch
                const newNotification = new Notification({
                  userId: userId,
                  type: 'task',
                  title: 'New Task Assigned',
                  message: `${title} is assigned to you. Due ${dueDateFormatted.toLocaleDateString()}.`,
                  link: `/dashboard/tasks/${newTask._id}`,
                  read: false,
                  createdAt: new Date()
                });
                
                await newNotification.save();
              } catch (notifyError) {
                console.error('Error creating in-app notification:', notifyError);
              }
            }
          }
        }
        
        // Send notification to admin users about new task creation
        try {
          // Find all super admin users
          const adminUsers = await User.find({ role: 'SUPER_ADMIN' });
          
          for (const admin of adminUsers) {
            if (admin._id.toString() !== user.userId) { // Don't notify the creator
              // Create notification directly using the model
              const adminNotification = new Notification({
                userId: admin._id.toString(),
                type: 'task',
                title: 'New Task Created',
                message: `${assignerName} created a new task: ${title}`,
                link: `/dashboard/tasks/${newTask._id}`,
                read: false,
                createdAt: new Date()
              });
              
              await adminNotification.save();
            }
          }
        } catch (adminNotifyError) {
          console.error('Error creating admin notifications:', adminNotifyError);
        }
        
        // Use notifyAdmins function if the assigner is not a super admin
        if (!isAssignerSuperAdmin) {
          try {
            await notifyAdmins(
              'New Task Assigned',
              `${assignerName} assigned a new task: ${title} to ${assignedUserNames.join(', ')}. Due on ${dueDateFormatted.toLocaleDateString()}.`,
              assignerName,
              'View Task',
              `/dashboard/tasks/${newTask._id}`
            );
          } catch (adminEmailError) {
            console.error('Error sending admin email notifications:', adminEmailError);
            // Continue even if admin notification fails
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
          if (tokenRecord) {
            try {
              const accessToken = await getValidAccessToken(tokenRecord);
              if (accessToken) {
                await createTaskEvent(accessToken, populatedTask);
              }
            } catch (calError) {
              console.error('Error syncing task to Google Calendar:', calError);
              // Continue even if calendar sync fails
            }
          }
        }
      } catch (calendarError) {
        console.error('Error with calendar integration:', calendarError);
        // Continue even if calendar operations fail
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
  }, 'tasks:create');
} 