import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { withAuth, hasRole } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// POST /api/tasks/batch - Perform batch operations on tasks
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const {
        operation,
        taskIds,
        data
      } = await request.json();
      
      // Validate input
      if (!operation || !taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid request. Operation and taskIds array are required' },
          { status: 400 }
        );
      }
      
      await connectToDatabase();
      
      // Check user permissions - only managers and admins can perform batch operations
      if (!hasRole(user, 'SUPER_ADMIN', 'MANAGER')) {
        // Exception: Employees can update status of their own tasks
        if (operation === 'updateStatus' && user.role === 'EMPLOYEE') {
          // Will check individual task permissions below
        } else {
          return NextResponse.json(
            { success: false, message: 'Not authorized to perform batch operations' },
            { status: 403 }
          );
        }
      }
      
      let updateResults = { success: 0, failed: 0, notAuthorized: 0 };
      
      // Process batch operation
      switch (operation) {
        case 'updateStatus': {
          if (!data?.status) {
            return NextResponse.json(
              { success: false, message: 'Status is required for updateStatus operation' },
              { status: 400 }
            );
          }
          
          const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'INCOMPLETE'];
          if (!allowedStatuses.includes(data.status)) {
            return NextResponse.json(
              { success: false, message: 'Invalid status value' },
              { status: 400 }
            );
          }
          
          // Update status for each task
          for (const taskId of taskIds) {
            try {
              const task = await Task.findById(taskId);
              
              if (!task) {
                updateResults.failed++;
                continue;
              }
              
              // If user is an employee, they can only update their own tasks
              if (user.role === 'EMPLOYEE') {
                const isAssigned = task.assignedTo.some(
                  assignee => assignee.toString() === user.userId
                );
                
                if (!isAssigned) {
                  updateResults.notAuthorized++;
                  continue;
                }
              }
              
              // Update task status
              task.status = data.status;
              
              // If completing the task, set the completion date
              if (data.status === 'COMPLETED' && task.status !== 'COMPLETED') {
                task.completedDate = new Date();
              } else if (data.status !== 'COMPLETED') {
                task.completedDate = undefined;
              }
              
              await task.save();
              updateResults.success++;
            } catch (err) {
              console.error(`Error updating task ${taskId}:`, err);
              updateResults.failed++;
            }
          }
          break;
        }
        
        case 'assignUsers': {
          if (!data?.assignedTo || !Array.isArray(data.assignedTo) || data.assignedTo.length === 0) {
            return NextResponse.json(
              { success: false, message: 'assignedTo array is required for assignUsers operation' },
              { status: 400 }
            );
          }
          
          // Verify all user IDs exist
          for (const userId of data.assignedTo) {
            const userExists = await User.exists({ _id: userId });
            if (!userExists) {
              return NextResponse.json(
                { success: false, message: `User with ID ${userId} not found` },
                { status: 404 }
              );
            }
          }
          
          // Assign users to each task
          for (const taskId of taskIds) {
            try {
              const task = await Task.findById(taskId);
              
              if (!task) {
                updateResults.failed++;
                continue;
              }
              
              // Only the user who created the task or an admin can reassign
              if (user.role !== 'SUPER_ADMIN' && task.assignedBy.toString() !== user.userId) {
                updateResults.notAuthorized++;
                continue;
              }
              
              // Get previous assignees for notification tracking
              const previousAssignedTo = Array.isArray(task.assignedTo) 
                ? task.assignedTo.map(id => id.toString())
                : [task.assignedTo.toString()];
              
              // Update assignees
              task.assignedTo = data.assignedTo;
              await task.save();
              updateResults.success++;
              
              // Identify new assignees who need notifications
              const newAssignees = data.assignedTo.filter(
                userId => !previousAssignedTo.includes(userId.toString())
              );
              
              // Send email notifications to new assignees
              if (newAssignees.length > 0) {
                try {
                  const assignerUser = await User.findById(user.userId);
                  const assignerName = assignerUser ? assignerUser.name : 'Administrator';
                  
                  // Populate task for emails
                  const populatedTask = await Task.findById(taskId)
                    .populate('assignedTo', 'name email')
                    .populate('assignedBy', 'name');
                  
                  for (const userId of newAssignees) {
                    const assignedUser = await User.findById(userId);
                    
                    if (assignedUser && assignedUser.email) {
                      await sendEmail(
                        assignedUser.email,
                        `New Task Assigned: ${task.title}`,
                        `
                          <h2>You have been assigned a new task</h2>
                          <p>Hello ${assignedUser.name},</p>
                          <p>You have been assigned to the following task:</p>
                          <p><strong>Title:</strong> ${task.title}</p>
                          <p><strong>Description:</strong> ${task.description}</p>
                          <p><strong>Due Date:</strong> ${task.dueDate.toDateString()}</p>
                          <p><strong>Assigned By:</strong> ${assignerName}</p>
                          <p>Please log in to the Task Management System to view details and update your progress.</p>
                        `
                      );
                    }
                  }
                } catch (emailError) {
                  console.error('Error sending email notifications to new assignees:', emailError);
                }
              }
            } catch (err) {
              console.error(`Error assigning users to task ${taskId}:`, err);
              updateResults.failed++;
            }
          }
          break;
        }
        
        case 'delete': {
          // Delete tasks
          for (const taskId of taskIds) {
            try {
              const task = await Task.findById(taskId);
              
              if (!task) {
                updateResults.failed++;
                continue;
              }
              
              // Only the user who created the task or an admin can delete
              if (user.role !== 'SUPER_ADMIN' && task.assignedBy.toString() !== user.userId) {
                updateResults.notAuthorized++;
                continue;
              }
              
              await Task.findByIdAndDelete(taskId);
              updateResults.success++;
            } catch (err) {
              console.error(`Error deleting task ${taskId}:`, err);
              updateResults.failed++;
            }
          }
          break;
        }
        
        default:
          return NextResponse.json(
            { success: false, message: `Unsupported operation: ${operation}` },
            { status: 400 }
          );
      }
      
      return NextResponse.json({
        success: true,
        message: `Batch operation ${operation} completed`,
        results: updateResults
      });
    } catch (error) {
      console.error('Error performing batch operation:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to perform batch operation' },
        { status: 500 }
      );
    }
  });
} 