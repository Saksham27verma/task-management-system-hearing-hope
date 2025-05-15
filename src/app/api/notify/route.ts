import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Notification from '@/models/Notification';
import { ObjectId } from 'mongodb';

// POST /api/notify - Create a notification
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { userId, type, title, message, link } = await request.json();

      // Validate required fields
      if (!userId || !type || !title || !message) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Connect to the database
      await connectToDatabase();

      // Save the notification
      const newNotification = new Notification({
        userId,
        type,
        title,
        message,
        link,
        read: false,
        createdAt: new Date()
      });

      await newNotification.save();

      return NextResponse.json(
        { 
          success: true, 
          message: 'Notification created',
          notificationId: newNotification._id
        }
      );
    } catch (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create notification' },
        { status: 500 }
      );
    }
  });
}

// GET /api/notify - Get notifications for current user
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const userId = user.userId;
      
      console.log(`Fetching notifications for user: ${userId}`);
      
      await connectToDatabase();
      
      // Auto-cleanup: Delete old notifications (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      try {
        const deleteResult = await Notification.deleteMany({
          userId,
          createdAt: { $lt: thirtyDaysAgo }
        });
        
        if (deleteResult.deletedCount > 0) {
          console.log(`Cleaned up ${deleteResult.deletedCount} old notifications for user ${userId}`);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up old notifications:', cleanupError);
        // Continue with fetching even if cleanup fails
      }
      
      // Get all notifications for this user (both read and unread)
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)  // Increased from 20 to 50
        .exec();
        
      // Count unread notifications
      const unreadCount = await Notification.countDocuments({ 
        userId, 
        read: false 
      });
      
      console.log(`Found ${notifications.length} notifications, ${unreadCount} unread`);
      
      return NextResponse.json({ 
        success: true, 
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/notify - Delete notifications
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const url = new URL(request.url);
      const notificationId = url.searchParams.get('id');
      const deleteAll = url.searchParams.get('all') === 'true';
      const userId = user.userId;
      
      await connectToDatabase();
      
      let deleteCount = 0;
      
      if (deleteAll) {
        // Delete all notifications for this user
        const result = await Notification.deleteMany({ userId });
        deleteCount = result.deletedCount || 0;
        console.log(`Deleted all (${deleteCount}) notifications for user ${userId}`);
      } else if (notificationId) {
        // Delete a specific notification
        const result = await Notification.deleteOne({
          _id: new ObjectId(notificationId),
          userId
        });
        deleteCount = result.deletedCount || 0;
        console.log(`Deleted notification ${notificationId} for user ${userId}`);
      } else {
        return NextResponse.json(
          { success: false, message: 'Missing id or all parameter' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${deleteCount} notification(s) deleted` 
      });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete notifications' },
        { status: 500 }
      );
    }
  });
} 