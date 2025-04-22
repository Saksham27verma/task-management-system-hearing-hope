import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import GoogleCalendarToken from '@/models/GoogleCalendarToken';
import Task from '@/models/Task';
import { syncTasksToGoogleCalendar, getValidAccessToken } from '@/services/googleCalendar';

// POST /api/google/sync - Manually sync tasks to Google Calendar
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Check if Google Calendar is connected
      let tokenRecord = null;
      try {
        tokenRecord = await GoogleCalendarToken.findOne({ userId: user.userId }).lean();
      } catch (error) {
        console.error('Error finding token record:', error);
      }
      
      if (!tokenRecord) {
        return NextResponse.json(
          { success: false, message: 'Google Calendar not connected' },
          { status: 400 }
        );
      }
      
      // Get a valid access token (will refresh if expired)
      const validAccessToken = await getValidAccessToken(user.userId);
      
      if (!validAccessToken) {
        return NextResponse.json(
          { success: false, message: 'Failed to get valid Google Calendar access token' },
          { status: 500 }
        );
      }
      
      // Get tasks for current user based on settings
      let tasks = [];
      try {
        tasks = await Task.find({
          assignedTo: user.userId,
          taskType: { $in: tokenRecord.syncSettings.taskTypes },
          dueDate: { $gte: new Date() }, // Only sync upcoming tasks
        })
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .lean()
        .exec();
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch tasks for syncing' },
          { status: 500 }
        );
      }
      
      if (tasks.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No upcoming tasks to sync',
        });
      }
      
      // Sync tasks to Google Calendar
      try {
        const result = await syncTasksToGoogleCalendar(validAccessToken, tasks);
        
        return NextResponse.json({
          success: true,
          message: `Successfully synced ${result.successful} existing tasks to Google Calendar. ${result.failed} tasks failed to sync.`,
          syncedTasks: result.successful,
          updatedTasks: result.updated,
          failedTasks: result.failed
        });
      } catch (syncError) {
        console.error('Error syncing to Google Calendar:', syncError);
        return NextResponse.json(
          { success: false, message: 'Failed to sync with Google Calendar' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error in sync process:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to sync with Google Calendar' },
        { status: 500 }
      );
    }
  });
} 