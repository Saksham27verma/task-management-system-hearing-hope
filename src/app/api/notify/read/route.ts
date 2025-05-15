import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Notification from '@/models/Notification';
import { ObjectId } from 'mongodb';

// PUT /api/notify/read - Mark notifications as read
export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { notificationIds, markAll } = await request.json();
      const userId = user.userId;
      
      console.log(`Marking notifications as read for user: ${userId}`,
        markAll ? '(all)' : `(ids: ${notificationIds?.length || 0})`);
      
      await connectToDatabase();
      
      let updatedCount = 0;
      
      if (markAll === true) {
        // Mark all unread notifications as read
        const result = await Notification.updateMany(
          { userId, read: false },
          { $set: { read: true } }
        );
        
        updatedCount = result.modifiedCount || 0;
        console.log(`Marked all (${updatedCount}) notifications as read for user ${userId}`);
      } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
        // Convert string IDs to ObjectId if needed
        const objectIds = notificationIds.map(id => {
          try {
            return new ObjectId(id);
          } catch (e) {
            return id; // Keep as is if not a valid ObjectId
          }
        });
        
        // Mark specific notifications as read
        const result = await Notification.updateMany(
          { 
            _id: { $in: objectIds },
            userId
          },
          { $set: { read: true } }
        );
        
        updatedCount = result.modifiedCount || 0;
        console.log(`Marked ${updatedCount} specific notifications as read for user ${userId}`);
      } else {
        return NextResponse.json(
          { success: false, message: 'Missing notificationIds or markAll parameter' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `${updatedCount} notification(s) marked as read`,
        updatedCount
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
  });
} 