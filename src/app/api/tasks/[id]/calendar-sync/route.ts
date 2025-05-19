import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import GoogleCalendarToken from '@/models/GoogleCalendarToken';
import { createTaskEvent, updateTaskEvent, getValidAccessToken } from '@/services/googleCalendar';

// POST /api/tasks/[id]/calendar-sync - Sync a task to Google Calendar
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the task ID from params
  const { id: taskId } = params;
  
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Get the task
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .lean();
      
      if (!task) {
        return NextResponse.json(
          { success: false, message: 'Task not found' },
          { status: 404 }
        );
      }
      
      // Check if this task belongs to the current user
      if (task.assignedTo._id.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to sync this task' },
          { status: 403 }
        );
      }
      
      // Check if user has Google Calendar connected
      const tokenRecord = await GoogleCalendarToken.findOne({ userId: user.userId }).lean();
      
      if (!tokenRecord) {
        return NextResponse.json(
          { success: false, message: 'Google Calendar not connected' },
          { status: 400 }
        );
      }
      
      // Check if task type is included in sync settings
      if (!tokenRecord.syncSettings.taskTypes.includes(task.taskType)) {
        return NextResponse.json({
          success: false,
          message: `${task.taskType} tasks are not set to sync based on your settings`
        });
      }
      
      // Get a valid access token (will refresh if expired)
      const validAccessToken = await getValidAccessToken(user.userId);
      
      if (!validAccessToken) {
        return NextResponse.json(
          { success: false, message: 'Failed to get valid Google Calendar access token' },
          { status: 500 }
        );
      }
      
      // Sync to Google Calendar
      try {
        let result;
        let message;
        
        // For explicit manual syncs, we still allow creating new events
        // This is an intentional user action, so we create or update as needed
        if (task.googleCalendarEventId) {
          // Update existing event
          result = await updateTaskEvent(validAccessToken, task, task.googleCalendarEventId);
          message = 'Task updated in Google Calendar successfully';
        } else {
          // Create new event
          result = await createTaskEvent(validAccessToken, task);
          
          // Store the event ID in the task
          if (result && result.id) {
            await Task.findByIdAndUpdate(taskId, { googleCalendarEventId: result.id });
          }
          
          message = 'Task synced to Google Calendar successfully';
        }
        
        return NextResponse.json({
          success: true,
          message: message,
          eventId: result.id
        });
      } catch (syncError) {
        console.error('Error syncing task to Google Calendar:', syncError);
        return NextResponse.json(
          { success: false, message: 'Failed to sync task with Google Calendar' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error(`Error syncing task ${taskId} to Google Calendar:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to sync task to Google Calendar' },
        { status: 500 }
      );
    }
  });
} 