import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth, hasRole } from '@/lib/auth';
import { notifyTaskStatusChange } from '@/lib/whatsapp';
import GoogleCalendarToken from '@/models/GoogleCalendarToken';
import { createTaskEvent, updateTaskEvent, deleteTaskEvent, getValidAccessToken } from '@/services/googleCalendar';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';
import Notification from '@/models/Notification';

// GET /api/tasks/[id] - Get a specific task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the task ID from params
  const { id: taskId } = params;
  
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .populate('progressUpdates.updatedBy', 'name');
      
      if (!task) {
        return NextResponse.json(
          { success: false, message: 'Task not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission to view this task
      if (user.role === 'EMPLOYEE') {
        // Handle both array of users and single user for assignedTo
        const isAssigned = Array.isArray(task.assignedTo)
          ? task.assignedTo.some(assignee => assignee._id.toString() === user.userId)
          : task.assignedTo._id.toString() === user.userId;
        
        const isAssigner = task.assignedBy._id.toString() === user.userId;
        
        if (!isAssigned && !isAssigner) {
          return NextResponse.json(
            { success: false, message: 'Not authorized to view this task' },
            { status: 403 }
          );
        }
      }
      
      return NextResponse.json({
        success: true,
        task
      });
    } catch (error) {
      console.error(`Error fetching task ${taskId}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch task' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the task ID from params
  const { id: taskId } = params;
  
  return withAuth(request, async (user) => {
    try {
      const {
        title,
        description,
        assignedTo,
        taskType,
        status,
        dueDate,
        remarks
      } = await request.json();
      
      // Validate that if assignedTo is provided, it's an array and not empty
      if (assignedTo && (!Array.isArray(assignedTo) || assignedTo.length === 0)) {
        return NextResponse.json(
          { success: false, message: 'At least one user must be assigned to the task' },
          { status: 400 }
        );
      }
      
      await connectToDatabase();
      
      // Find the task
      const task = await Task.findById(taskId);
      
      if (!task) {
        return NextResponse.json(
          { success: false, message: 'Task not found' },
          { status: 404 }
        );
      }
      
      // Keep track of previous assignees to handle notifications for new assignees
      const previousAssignedTo = Array.isArray(task.assignedTo) 
        ? task.assignedTo.map(id => id.toString())
        : [task.assignedTo.toString()];
        
      // Track newly assigned users
      let newAssignees: string[] = [];
        
      if (assignedTo) {
        const currentAssignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
        newAssignees = currentAssignedTo.filter(userId => !previousAssignedTo.includes(userId.toString()));
      }
      
      // Check if user has permission to update this task
      if (user.role === 'EMPLOYEE') {
        // Check if employee is one of the assigned users
        const isAssigned = Array.isArray(task.assignedTo)
          ? task.assignedTo.some(userId => userId.toString() === user.userId)
          : task.assignedTo.toString() === user.userId;
            
        if (!isAssigned) {
          return NextResponse.json(
            { success: false, message: 'Not authorized to update this task' },
            { status: 403 }
          );
        }
        
        // Employees can only update status and add progress updates, not reassign or change other fields
        if (assignedTo || title || description || taskType || dueDate) {
          return NextResponse.json(
            { success: false, message: 'Employees can only update task status' },
            { status: 403 }
          );
        }
      } else if (user.role === 'MANAGER' && task.assignedBy.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to update this task' },
          { status: 403 }
        );
      }
      
      // Update task fields
      if (title) task.title = title;
      if (description) task.description = description;
      if (assignedTo) task.assignedTo = assignedTo;
      if (taskType) task.taskType = taskType;
      if (status) {
        // Track previous status for notifications
        const previousStatus = task.status;
        
        task.status = status;
        
        // If task is being marked as completed, set completedDate
        if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
          task.completedDate = new Date();
          
          // Send notification for task completion
          try {
            // Notify admin users about task completion
            const adminUsers = await User.find({ role: 'SUPER_ADMIN' });
            
            for (const admin of adminUsers) {
              const notification = new Notification({
                userId: admin._id.toString(),
                type: 'task',
                title: 'Task Completed',
                message: `Task "${task.title}" has been marked as complete.`,
                link: `/dashboard/tasks/${task._id}`,
                read: false,
                createdAt: new Date()
              });
              
              await notification.save();
            }
            
            // Check if this is a super admin-only task
            const checkAssignees = async () => {
              if (Array.isArray(task.assignedTo)) {
                // Check if every assignee is a super admin
                for (const assigneeId of task.assignedTo) {
                  const assignee = await User.findById(assigneeId);
                  if (!assignee || assignee.role !== 'SUPER_ADMIN') {
                    return false; // Found a non-super-admin
                  }
                }
                return true; // All are super admins
              } else {
                // Single assignee
                const assignee = await User.findById(task.assignedTo);
                return assignee && assignee.role === 'SUPER_ADMIN';
              }
            };
            
            // Check if assigner is a super admin
            const assigner = await User.findById(task.assignedBy);
            const isAssignedBySuperAdmin = assigner && assigner.role === 'SUPER_ADMIN';
            
            // Only proceed with notification if not a super admin-only task or if recipient is a super admin
            if (task.assignedBy.toString() !== user.userId) {
              const isAssignedToSuperAdminsOnly = await checkAssignees();
              const isSuperAdminOnlyTask = isAssignedToSuperAdminsOnly && isAssignedBySuperAdmin;
              
              const taskCreator = await User.findById(task.assignedBy);
              
              // Skip notification if this is a super admin-only task and the creator is not a super admin
              if (!isSuperAdminOnlyTask || (taskCreator && taskCreator.role === 'SUPER_ADMIN')) {
                const notification = new Notification({
                  userId: task.assignedBy.toString(),
                  type: 'task',
                  title: 'Task Completed',
                  message: `Task "${task.title}" has been marked as complete.`,
                  link: `/dashboard/tasks/${task._id}`,
                  read: false,
                  createdAt: new Date()
                });
                
                await notification.save();
              }
            }
          } catch (notifyError) {
            console.error('Error sending task completion notifications:', notifyError);
          }
          
          // Send WhatsApp notifications for task completion
          try {
            console.log('[WhatsApp Debug - Task Completion] Starting WhatsApp notification process');
            console.log('[WhatsApp Debug - Task Completion] Task title:', task.title);
            console.log('[WhatsApp Debug - Task Completion] Previous status:', previousStatus);
            console.log('[WhatsApp Debug - Task Completion] New status:', status);
            
            // Get the user who completed the task
            const completingUser = await User.findById(user.userId);
            const completedByName = completingUser ? completingUser.name : 'A user';
            
            console.log('[WhatsApp Debug - Task Completion] Completed by:', completedByName);
            
            // Collect all users who should be notified via WhatsApp
            const whatsappNotifyIds = [];
            
            // Add task assigner if different from current user
            if (task.assignedBy.toString() !== user.userId) {
              whatsappNotifyIds.push(task.assignedBy.toString());
              console.log('[WhatsApp Debug - Task Completion] Added assigner to notify list:', task.assignedBy.toString());
            }
            
            // Add all assignees except the current user
            if (Array.isArray(task.assignedTo)) {
              for (const assigneeId of task.assignedTo) {
                if (assigneeId.toString() !== user.userId) {
                  whatsappNotifyIds.push(assigneeId.toString());
                  console.log('[WhatsApp Debug - Task Completion] Added assignee to notify list:', assigneeId.toString());
                }
              }
            } else if (task.assignedTo.toString() !== user.userId) {
              whatsappNotifyIds.push(task.assignedTo.toString());
              console.log('[WhatsApp Debug - Task Completion] Added single assignee to notify list:', task.assignedTo.toString());
            }
            
            console.log('[WhatsApp Debug - Task Completion] Total users to notify:', whatsappNotifyIds.length);
            console.log('[WhatsApp Debug - Task Completion] User IDs to notify:', whatsappNotifyIds);
            
            // Send WhatsApp notifications
            if (whatsappNotifyIds.length > 0) {
              console.log('[WhatsApp Debug - Task Completion] Calling notifyTaskStatusChange function...');
              
              const result = await notifyTaskStatusChange(
                task.title,
                task._id.toString(),
                previousStatus,
                status,
                whatsappNotifyIds
              );
              
              console.log('[WhatsApp Debug - Task Completion] notifyTaskStatusChange result:', result);
              
              if (result.success) {
                console.log(`[WhatsApp] ✅ Task completion notifications sent successfully for: ${task.title}`);
              } else {
                console.log(`[WhatsApp] ❌ Task completion notifications failed for: ${task.title}`);
                if (result.qrCodes && result.qrCodes.length > 0) {
                  console.log(`[WhatsApp] 📱 Generated ${result.qrCodes.length} QR codes as fallback`);
                }
              }
            } else {
              console.log('[WhatsApp Debug - Task Completion] No users to notify, skipping WhatsApp notifications');
            }
          } catch (whatsappError) {
            console.error('[WhatsApp Debug - Task Completion] Error sending WhatsApp notifications:', whatsappError);
            console.error('[WhatsApp Debug - Task Completion] Error stack:', whatsappError.stack);
            // Continue even if WhatsApp notifications fail
          }
        } else if (status !== 'COMPLETED') {
          task.completedDate = undefined;
          
          // Send notification for status change (if not to completed, which is handled above)
          if (status !== previousStatus) {
            try {
              // Notify admin users about status change
              const adminUsers = await User.find({ role: 'SUPER_ADMIN' });
              
              for (const admin of adminUsers) {
                const notification = new Notification({
                  userId: admin._id.toString(),
                  type: 'status',
                  title: 'Task Status Updated',
                  message: `Task "${task.title}" changed from ${previousStatus} to ${status}.`,
                  link: `/dashboard/tasks/${task._id}`,
                  read: false,
                  createdAt: new Date()
                });
                
                await notification.save();
              }
              
              // Check if this is a super admin-only task
              const checkAssignees = async () => {
                if (Array.isArray(task.assignedTo)) {
                  // Check if every assignee is a super admin
                  for (const assigneeId of task.assignedTo) {
                    const assignee = await User.findById(assigneeId);
                    if (!assignee || assignee.role !== 'SUPER_ADMIN') {
                      return false; // Found a non-super-admin
                    }
                  }
                  return true; // All are super admins
                } else {
                  // Single assignee
                  const assignee = await User.findById(task.assignedTo);
                  return assignee && assignee.role === 'SUPER_ADMIN';
                }
              };
              
              // Check if assigner is a super admin
              const assigner = await User.findById(task.assignedBy);
              const isAssignedBySuperAdmin = assigner && assigner.role === 'SUPER_ADMIN';
              
              // Only notify the task creator if allowed
              if (task.assignedBy.toString() !== user.userId) {
                const isAssignedToSuperAdminsOnly = await checkAssignees();
                const isSuperAdminOnlyTask = isAssignedToSuperAdminsOnly && isAssignedBySuperAdmin;
                
                const taskCreator = await User.findById(task.assignedBy);
                
                // Skip notification if this is a super admin-only task and the creator is not a super admin
                if (!isSuperAdminOnlyTask || (taskCreator && taskCreator.role === 'SUPER_ADMIN')) {
                  const notification = new Notification({
                    userId: task.assignedBy.toString(),
                    type: 'status',
                    title: 'Task Status Updated',
                    message: `Task "${task.title}" changed from ${previousStatus} to ${status}.`,
                    link: `/dashboard/tasks/${task._id}`,
                    read: false,
                    createdAt: new Date()
                  });
                  
                  await notification.save();
                }
              }
            } catch (notifyError) {
              console.error('Error sending status change notifications:', notifyError);
            }
            
            // Send WhatsApp notifications for status change
            try {
              console.log('[WhatsApp Debug - Status Change] Starting WhatsApp notification process');
              console.log('[WhatsApp Debug - Status Change] Task title:', task.title);
              console.log('[WhatsApp Debug - Status Change] Previous status:', previousStatus);
              console.log('[WhatsApp Debug - Status Change] New status:', status);
              
              // Get the user who changed the status
              const changingUser = await User.findById(user.userId);
              const changedByName = changingUser ? changingUser.name : 'A user';
              
              console.log('[WhatsApp Debug - Status Change] Changed by:', changedByName);
              
              // Collect all users who should be notified via WhatsApp
              const whatsappNotifyIds = [];
              
              // Add task assigner if different from current user
              if (task.assignedBy.toString() !== user.userId) {
                whatsappNotifyIds.push(task.assignedBy.toString());
                console.log('[WhatsApp Debug - Status Change] Added assigner to notify list:', task.assignedBy.toString());
              }
              
              // Add all assignees except the current user
              if (Array.isArray(task.assignedTo)) {
                for (const assigneeId of task.assignedTo) {
                  if (assigneeId.toString() !== user.userId) {
                    whatsappNotifyIds.push(assigneeId.toString());
                    console.log('[WhatsApp Debug - Status Change] Added assignee to notify list:', assigneeId.toString());
                  }
                }
              } else if (task.assignedTo.toString() !== user.userId) {
                whatsappNotifyIds.push(task.assignedTo.toString());
                console.log('[WhatsApp Debug - Status Change] Added single assignee to notify list:', task.assignedTo.toString());
              }
              
              console.log('[WhatsApp Debug - Status Change] Total users to notify:', whatsappNotifyIds.length);
              console.log('[WhatsApp Debug - Status Change] User IDs to notify:', whatsappNotifyIds);
              
              // Send WhatsApp notifications
              if (whatsappNotifyIds.length > 0) {
                console.log('[WhatsApp Debug - Status Change] Calling notifyTaskStatusChange function...');
                
                const result = await notifyTaskStatusChange(
                  task.title,
                  task._id.toString(),
                  previousStatus,
                  status,
                  whatsappNotifyIds
                );
                
                console.log('[WhatsApp Debug - Status Change] notifyTaskStatusChange result:', result);
                
                if (result.success) {
                  console.log(`[WhatsApp] ✅ Task status change notifications sent successfully for: ${task.title}`);
                } else {
                  console.log(`[WhatsApp] ❌ Task status change notifications failed for: ${task.title}`);
                  if (result.qrCodes && result.qrCodes.length > 0) {
                    console.log(`[WhatsApp] 📱 Generated ${result.qrCodes.length} QR codes as fallback`);
                  }
                }
              } else {
                console.log('[WhatsApp Debug - Status Change] No users to notify, skipping WhatsApp notifications');
              }
            } catch (whatsappError) {
              console.error('[WhatsApp Debug - Status Change] Error sending WhatsApp notifications:', whatsappError);
              console.error('[WhatsApp Debug - Status Change] Error stack:', whatsappError.stack);
              // Continue even if WhatsApp notifications fail
            }
          }
        }
      }
      if (dueDate) task.dueDate = new Date(dueDate);
      if (remarks !== undefined) task.remarks = remarks;
      
      // Save updated task
      await task.save();
      
      // If task was assigned to new users, send email notifications
      if (newAssignees.length > 0) {
        try {
          // Get assigner details
          const assignerUser = await User.findById(user.userId);
          const assignerName = assignerUser ? assignerUser.name : 'Administrator';
          
          // Send email to each new assignee
          for (const userId of newAssignees) {
            const assignedUser = await User.findById(userId);
            
            if (assignedUser && assignedUser.email) {
              const emailHtml = `
                <h2>You have been assigned a new task</h2>
                <p>Hello ${assignedUser.name},</p>
                <p>You have been assigned to the following task:</p>
                <p><strong>Title:</strong> ${task.title}</p>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Due Date:</strong> ${task.dueDate.toDateString()}</p>
                <p><strong>Assigned By:</strong> ${assignerName}</p>
                <p>Please log in to the Task Management System to view details and update your progress.</p>
              `;
              
              await sendEmail(
                assignedUser.email,
                `New Task Assigned: ${task.title}`,
                emailHtml
              );
            }
          }
        } catch (emailError) {
          console.error('Error sending email notifications to new assignees:', emailError);
          // Continue even if email fails
        }
      }
      
      // Check if Google Calendar sync is needed - for real-time setting
      try {
        // Populate the task for Google Calendar sync
        const populatedTask = await Task.findById(task._id)
          .populate('assignedTo', 'name email')
          .populate('assignedBy', 'name email')
          .lean();
          
        // Get all current assignees
        const currentAssignees = Array.isArray(task.assignedTo) 
          ? task.assignedTo.map(id => id.toString())
          : [task.assignedTo.toString()];
          
        // For each assignee, check if they have Google Calendar connected
        for (const userId of currentAssignees) {
          // Check if assignee has Google Calendar connected with real-time sync
          const tokenRecord = await GoogleCalendarToken.findOne({ 
            userId: userId,
            'syncSettings.syncFrequency': 'realtime'
          });
          
          // If connected and real-time sync is enabled, sync to Google Calendar
          if (tokenRecord && tokenRecord.syncSettings.taskTypes.includes(task.taskType)) {
            try {
              // Get a valid access token (will refresh if expired)
              const validAccessToken = await getValidAccessToken(userId);
              
              if (!validAccessToken) {
                console.error('Could not get a valid access token for Google Calendar sync');
                continue; // Skip this user and try the next one
              }
              
              // Only update existing Google Calendar events, don't create new ones during editing
              if (task.googleCalendarEventId) {
                await updateTaskEvent(validAccessToken, populatedTask, task.googleCalendarEventId);
              } else if (newAssignees.includes(userId)) {
                // Create a new event only for newly assigned users
                const eventResult = await createTaskEvent(validAccessToken, populatedTask);
                
                // Store the event ID in the task if it doesn't have one yet
                if (eventResult && eventResult.id && !task.googleCalendarEventId) {
                  task.googleCalendarEventId = eventResult.id;
                  await task.save();
                }
              }
            } catch (syncError) {
              // Log error but don't affect the main task update response
              console.error(`Error syncing updated task to Google Calendar for user ${userId}:`, syncError);
            }
          }
        }
      } catch (calendarError) {
        // Log error but don't affect the main task update response
        console.error('Error checking Google Calendar connection:', calendarError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Task updated successfully'
      });
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to update task' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the task ID from params
  const { id: taskId } = params;
  
  return withAuth(request, async (user) => {
    // Only allow managers and admins to delete tasks
    if (!hasRole(user, 'SUPER_ADMIN', 'MANAGER')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete tasks' },
        { status: 403 }
      );
    }
    
    try {
      await connectToDatabase();
      
      // Find the task
      const task = await Task.findById(taskId);
      
      if (!task) {
        return NextResponse.json(
          { success: false, message: 'Task not found' },
          { status: 404 }
        );
      }
      
      // If user is a manager, check if they assigned the task
      if (user.role === 'MANAGER' && task.assignedBy.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to delete this task' },
          { status: 403 }
        );
      }
      
      // Delete Google Calendar event if it exists
      if (task.googleCalendarEventId) {
        try {
          const tokenRecord = await GoogleCalendarToken.findOne({
            userId: task.assignedTo.toString()
          });
          
          if (tokenRecord) {
            await deleteTaskEvent(tokenRecord.accessToken, task.googleCalendarEventId);
          }
        } catch (calendarError) {
          // Log error but don't affect the main task deletion
          console.error('Error deleting Google Calendar event:', calendarError);
        }
      }
      
      // Delete the task
      await Task.findByIdAndDelete(taskId);
      
      return NextResponse.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete task' },
        { status: 500 }
      );
    }
  });
} 