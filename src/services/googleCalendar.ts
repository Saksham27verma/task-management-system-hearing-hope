import Task, { ITask } from '@/models/Task';
import connectToDatabase from '@/lib/db';
import GoogleCalendarToken, { IGoogleCalendarToken } from '@/models/GoogleCalendarToken';
import { Document } from 'mongoose';

// Function to get user's Google tokens
export async function getUserGoogleTokens(userId: string): Promise<IGoogleCalendarToken | null> {
  await connectToDatabase();
  try {
    // Using a different approach to avoid TypeScript issues with Mongoose
    const tokenDoc = await GoogleCalendarToken.findOne({ userId });
    return tokenDoc;
  } catch (error) {
    console.error('Error fetching Google tokens:', error);
    return null;
  }
}

// Function to refresh an expired access token
export async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

// Check if token is expired and refresh if needed
export async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    await connectToDatabase();
    
    // Find the token record
    const tokenRecord = await GoogleCalendarToken.findOne({ userId });
    
    if (!tokenRecord) {
      console.error('No Google Calendar token found for user:', userId);
      return null;
    }
    
    // Check if token is expired (with 5 minute buffer)
    const now = new Date();
    const isExpired = tokenRecord.expiresAt <= new Date(now.getTime() + 5 * 60 * 1000);
    
    if (isExpired) {
      console.log('Google Calendar token expired, refreshing...');
      try {
        // Refresh the token
        const refreshedTokens = await refreshAccessToken(tokenRecord.refreshToken);
        
        // Update the database
        tokenRecord.accessToken = refreshedTokens.accessToken;
        tokenRecord.expiresAt = refreshedTokens.expiresAt;
        await tokenRecord.save();
        
        return refreshedTokens.accessToken;
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        return null;
      }
    }
    
    // Token is still valid
    return tokenRecord.accessToken;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    return null;
  }
}

// Function to create a task event in Google Calendar
export async function createTaskEvent(accessToken: string, task: any) {
  try {
    // Format the event for Google Calendar - simplified to just include title and description
    const event = {
      summary: task.title,
      description: task.description,
      start: {
        dateTime: new Date(task.dueDate).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // Default 1 hour duration
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: true,
      },
      colorId: getColorIdForTask(task),
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Google Calendar event: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

// Function to update an existing task event in Google Calendar
export async function updateTaskEvent(accessToken: string, task: any, eventId: string) {
  try {
    // Format the event for Google Calendar - simplified to just include title and description
    const event = {
      summary: task.title,
      description: task.description,
      start: {
        dateTime: new Date(task.dueDate).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // Default 1 hour duration
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: true,
      },
      colorId: getColorIdForTask(task),
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update Google Calendar event: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
}

// Function to delete a task event from Google Calendar
export async function deleteTaskEvent(accessToken: string, eventId: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete Google Calendar event: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}

// Function to sync all tasks to Google Calendar
export async function syncTasksToGoogleCalendar(accessToken: string, tasks: any[]) {
  let successful = 0;
  let failed = 0;
  let updated = 0;
  
  for (const task of tasks) {
    try {
      // Only update tasks that already have a Google Calendar event ID
      if (task.googleCalendarEventId) {
        await updateTaskEvent(accessToken, task, task.googleCalendarEventId);
        updated++;
        successful++;
      }
      // We don't create new events during syncing to avoid duplicates
    } catch (error) {
      console.error(`Error syncing task ${task._id}:`, error);
      failed++;
    }
  }
  
  return {
    successful,
    failed,
    updated,
    created: 0 // No new events are created during syncing
  };
}

// Helper function to get Google Calendar color ID based on task properties
function getColorIdForTask(task: any): string {
  // Google Calendar color IDs (approximate):
  // 1: Blue, 2: Green, 3: Purple, 4: Red, 5: Yellow, 
  // 6: Orange, 7: Turquoise, 8: Gray, 9: Bold Blue, 10: Bold Green, 11: Bold Red
  
  // Color by status
  switch (task.status) {
    case 'COMPLETED': return '2'; // Green
    case 'IN_PROGRESS': return '5'; // Yellow
    case 'DELAYED': 
    case 'INCOMPLETE': return '4'; // Red
    case 'PENDING': return '1'; // Blue
    default: return '8'; // Gray
  }
} 