import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import GoogleCalendarToken from '@/models/GoogleCalendarToken';

// GET /api/google/tokens - Get Google Calendar token status for current user
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Safely find token with try/catch
      let tokenRecord = null;
      try {
        tokenRecord = await GoogleCalendarToken.findOne({ userId: user.userId }).lean();
      } catch (error) {
        console.error('Error finding token record:', error);
      }
      
      return NextResponse.json({
        success: true,
        connected: !!tokenRecord,
        settings: tokenRecord?.syncSettings || {
          taskTypes: ['DAILY', 'WEEKLY', 'MONTHLY'],
          syncFrequency: 'daily',
        },
      });
    } catch (error) {
      console.error('Error fetching Google Calendar tokens:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch Google Calendar connection' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/google/tokens - Update sync settings
export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { syncSettings } = await request.json();
      
      if (!syncSettings || !syncSettings.taskTypes || !syncSettings.syncFrequency) {
        return NextResponse.json(
          { success: false, message: 'Invalid sync settings' },
          { status: 400 }
        );
      }
      
      await connectToDatabase();
      
      // Safely find and update token with try/catch
      let tokenRecord = null;
      try {
        tokenRecord = await GoogleCalendarToken.findOne({ userId: user.userId });
      } catch (error) {
        console.error('Error finding token record:', error);
      }
      
      if (!tokenRecord) {
        return NextResponse.json(
          { success: false, message: 'No Google Calendar connection found' },
          { status: 404 }
        );
      }
      
      // Update and save
      tokenRecord.syncSettings = syncSettings;
      await tokenRecord.save();
      
      return NextResponse.json({
        success: true,
        message: 'Sync settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating Google Calendar settings:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update Google Calendar settings' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/google/tokens - Disconnect Google Calendar
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Find and delete token
      try {
        await GoogleCalendarToken.findOneAndDelete({ userId: user.userId });
      } catch (error) {
        console.error('Error deleting token:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to disconnect Google Calendar' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Google Calendar disconnected successfully',
      });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to disconnect Google Calendar' },
        { status: 500 }
      );
    }
  });
} 