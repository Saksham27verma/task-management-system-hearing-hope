import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';

// POST /api/notify - Store a notification for a user
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Parse the request body
      const { userId, notification } = await request.json();
      
      // Validate required fields
      if (!userId || !notification || !notification.type || !notification.title || !notification.message) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Validate notification type
      if (!['task', 'notice', 'status'].includes(notification.type)) {
        return NextResponse.json(
          { success: false, message: 'Invalid notification type' },
          { status: 400 }
        );
      }
      
      await connectToDatabase();
      
      // Check if the user exists
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Role-based security check - Only allow SUPER_ADMINs or self to store notifications
      if (user.role !== 'SUPER_ADMIN' && user.userId !== userId) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to send notifications to this user' },
          { status: 403 }
        );
      }
      
      // Create and save the notification
      const newNotification = new Notification({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        read: false,
        createdAt: new Date()
      });
      
      await newNotification.save();
      
      return NextResponse.json({
        success: true,
        message: 'Notification stored successfully',
        notification: newNotification
      });
    } catch (error) {
      console.error('Error storing notification:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to store notification' },
        { status: 500 }
      );
    }
  });
}

// GET /api/notify - Get notifications for the current user
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
      
      await connectToDatabase();
      
      // Build query
      const query: any = { userId: user.userId };
      
      // Filter by read status if requested
      if (unreadOnly) {
        query.read = false;
      }
      
      // Get notifications
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })  // Newest first
        .limit(limit);
      
      // Get unread count
      const unreadCount = await Notification.countDocuments({ 
        userId: user.userId,
        read: false
      });
      
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

// PUT /api/notify/read - Mark notifications as read
export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { notificationIds, markAll } = await request.json();
      
      await connectToDatabase();
      
      if (markAll) {
        // Mark all notifications as read for this user
        await Notification.updateMany(
          { userId: user.userId, read: false },
          { read: true }
        );
        
        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read'
        });
      } else if (notificationIds && Array.isArray(notificationIds)) {
        // Mark specific notifications as read
        await Notification.updateMany(
          { 
            _id: { $in: notificationIds },
            userId: user.userId // Security check - only allow updating own notifications
          },
          { read: true }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Notifications marked as read'
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid request parameters' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/notify - Delete notifications
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { notificationIds, deleteAll } = await request.json();
      
      await connectToDatabase();
      
      if (deleteAll) {
        // Delete all notifications for this user
        await Notification.deleteMany({ userId: user.userId });
        
        return NextResponse.json({
          success: true,
          message: 'All notifications deleted'
        });
      } else if (notificationIds && Array.isArray(notificationIds)) {
        // Delete specific notifications
        await Notification.deleteMany({ 
          _id: { $in: notificationIds },
          userId: user.userId // Security check - only allow deleting own notifications
        });
        
        return NextResponse.json({
          success: true,
          message: 'Notifications deleted'
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid request parameters' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete notifications' },
        { status: 500 }
      );
    }
  });
} 