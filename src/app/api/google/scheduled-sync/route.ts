import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import GoogleCalendarToken from '@/models/GoogleCalendarToken';
import Task from '@/models/Task';
import { createTaskEvent, updateTaskEvent, getValidAccessToken, refreshAccessToken } from '@/services/googleCalendar';
import { addHours, addDays, isAfter } from 'date-fns';

// GET /api/google/scheduled-sync - Used by scheduler to sync tasks
export async function GET(request: NextRequest) {
  // No auth check, but we'll use a secret key to protect this endpoint
  const url = new URL(request.url);
  const secretKey = url.searchParams.get('key');
  const syncType = url.searchParams.get('type') || 'all'; // 'hourly', 'daily', or 'all'
  
  // Verify the secret key
  if (secretKey !== process.env.SCHEDULER_SECRET_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    await connectToDatabase();
    
    // Find tokens based on sync frequency
    const frequencyFilters = syncType === 'all' 
      ? ['hourly', 'daily'] 
      : [syncType];
    
    const tokens = await GoogleCalendarToken.find({
      'syncSettings.syncFrequency': { $in: frequencyFilters }
    }).lean();
    
    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to sync for the specified frequency',
        syncedTasks: 0
      });
    }
    
    // Initialize sync results
    let totalSyncedTasks = 0;
    let totalUpdatedTasks = 0;
    let totalNewTasks = 0;
    
    // Process each token/user
    for (const token of tokens) {
      // Skip tokens that were recently synced
      const shouldSync = shouldPerformSync(token.lastSyncTime, token.syncSettings.syncFrequency);
      
      if (!shouldSync) {
        continue;
      }
      
      try {
        // Get a valid access token for this user
        const validAccessToken = await getValidAccessToken(token.userId.toString());
        
        if (!validAccessToken) {
          console.error(`Could not get valid access token for user ${token.userId}`);
          continue; // Skip this user
        }
        
        // Get tasks for this user
        const tasks = await Task.find({
          assignedTo: token.userId,
          taskType: { $in: token.syncSettings.taskTypes },
          dueDate: { $gte: new Date() } // Only sync upcoming tasks
        })
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .lean();
        
        if (tasks.length === 0) {
          continue;
        }
        
        // Sync tasks
        let syncedCount = 0;
        for (const task of tasks) {
          try {
            // Only update tasks that already have a Google Calendar event ID
            if (task.googleCalendarEventId) {
              await updateTaskEvent(validAccessToken, task, task.googleCalendarEventId);
              totalUpdatedTasks++;
              syncedCount++;
            }
            // We don't create new events during scheduled syncing to avoid duplicates
          } catch (taskError) {
            console.error(`Error syncing task ${task._id} for user ${token.userId}:`, taskError);
          }
        }
        
        // Update the last sync time
        await GoogleCalendarToken.findByIdAndUpdate(token._id, {
          lastSyncTime: new Date()
        });
        
        totalSyncedTasks += syncedCount;
      } catch (userError) {
        console.error(`Error processing user ${token.userId}:`, userError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalSyncedTasks} existing calendar events for tasks`,
      syncedTasks: totalSyncedTasks,
      updatedTasks: totalUpdatedTasks
    });
  } catch (error) {
    console.error('Error in scheduled sync:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to perform scheduled sync' },
      { status: 500 }
    );
  }
}

// Helper function to determine if sync should be performed based on last sync time
function shouldPerformSync(lastSyncTime: Date, frequency: string): boolean {
  const now = new Date();
  
  switch (frequency) {
    case 'hourly':
      // If last sync was more than 1 hour ago
      return isAfter(now, addHours(new Date(lastSyncTime), 1));
    
    case 'daily':
      // If last sync was more than 1 day ago
      return isAfter(now, addDays(new Date(lastSyncTime), 1));
    
    case 'manual':
      // Never auto-sync for manual setting
      return false;
    
    case 'realtime':
      // Real-time is handled separately
      return false;
    
    default:
      return false;
  }
} 