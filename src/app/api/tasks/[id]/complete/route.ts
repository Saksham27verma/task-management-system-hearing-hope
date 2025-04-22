import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { withAuth } from '@/lib/auth';
import { sendEmail, emailTemplates } from '@/lib/email';
import User from '@/models/User';

// POST /api/tasks/[id]/complete - Mark a task as complete
export async function POST(
  request: NextRequest,
  { params }: any
) {
  // Get the task ID from params
  const taskId = params.id;
  
  return withAuth(request, async (user) => {
    try {
      // Optional remarks for task completion
      const { remarks } = await request.json().catch(() => ({}));
      
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
      if (user.role === 'EMPLOYEE' && 
          task.assignedTo._id.toString() !== user.userId) {
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
      } catch (emailError) {
        console.error('Error sending task completion notification:', emailError);
        // Continue even if email fails
      }
      
      return NextResponse.json({
        success: true,
        message: 'Task marked as complete successfully'
      });
    } catch (error) {
      console.error(`Error completing task ${taskId}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to complete task' },
        { status: 500 }
      );
    }
  });
} 