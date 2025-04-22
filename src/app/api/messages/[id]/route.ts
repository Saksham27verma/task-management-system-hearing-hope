import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import { withAuth } from '@/lib/auth';

// GET /api/messages/[id] - Get a specific message by ID
export async function GET(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      const message = await Message.findById(id)
        .populate('sender', 'name')
        .populate('recipient', 'name')
        .populate('relatedTask', 'title');
      
      if (!message) {
        return NextResponse.json(
          { success: false, message: 'Message not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission to view this message
      const isSender = message.sender._id.toString() === user.userId;
      const isRecipient = message.recipient._id.toString() === user.userId;
      
      if (!isSender && !isRecipient) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to view this message' },
          { status: 403 }
        );
      }
      
      // If recipient is viewing, mark as read if not already
      if (isRecipient && !message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
        await message.save();
      }
      
      return NextResponse.json({
        success: true,
        message
      });
    } catch (error) {
      console.error(`Error fetching message ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch message' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/messages/[id] - Mark a message as read/unread
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  return withAuth(request, async (user) => {
    try {
      const { isRead } = await request.json();
      
      if (isRead === undefined) {
        return NextResponse.json(
          { success: false, message: 'Missing required field: isRead' },
          { status: 400 }
        );
      }
      
      await connectToDatabase();
      
      // Find the message
      const message = await Message.findById(id);
      
      if (!message) {
        return NextResponse.json(
          { success: false, message: 'Message not found' },
          { status: 404 }
        );
      }
      
      // Check if user is the recipient
      if (message.recipient.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to update this message' },
          { status: 403 }
        );
      }
      
      // Update read status
      message.isRead = isRead;
      
      // Update readAt timestamp if marking as read
      if (isRead) {
        message.readAt = new Date();
      } else {
        message.readAt = undefined;
      }
      
      // Save updated message
      await message.save();
      
      return NextResponse.json({
        success: true,
        message: isRead ? 'Message marked as read' : 'Message marked as unread'
      });
    } catch (error) {
      console.error(`Error updating message ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to update message' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Find the message
      const message = await Message.findById(id);
      
      if (!message) {
        return NextResponse.json(
          { success: false, message: 'Message not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission to delete this message
      // Only the sender or recipient can delete a message
      const isSender = message.sender.toString() === user.userId;
      const isRecipient = message.recipient.toString() === user.userId;
      
      if (!isSender && !isRecipient) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to delete this message' },
          { status: 403 }
        );
      }
      
      // Delete the message
      await Message.findByIdAndDelete(id);
      
      return NextResponse.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting message ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete message' },
        { status: 500 }
      );
    }
  });
} 