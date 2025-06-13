import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import Task from '@/models/Task';
import { withAuth } from '@/lib/auth';
import { sendEmail, emailTemplates, notifyAdmins } from '@/lib/email';
import { notifyNewMessage } from '@/lib/whatsapp';

// GET /api/messages - Get messages for current user
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const url = new URL(request.url);
    
    // Parse query parameters
    const folder = url.searchParams.get('folder') || 'inbox'; // inbox, sent, all
    const isRead = url.searchParams.get('isRead'); // true, false, or null for all
    const searchQuery = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Connect to database
    await connectToDatabase();
    
    // Build query
    const query: any = {};
    
    // Apply folder filter
    if (folder === 'inbox') {
      query.recipient = user.userId;
    } else if (folder === 'sent') {
      query.sender = user.userId;
    } else if (folder === 'all') {
      query.$or = [
        { recipient: user.userId },
        { sender: user.userId }
      ];
    }
    
    // Apply read status filter
    if (isRead !== null && folder !== 'sent') {
      query.isRead = isRead === 'true';
    }
    
    // Apply search filter
    if (searchQuery) {
      // Add search criteria to existing query
      const searchCriteria = [
        { subject: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } }
      ];
      
      if (query.$or) {
        // If $or already exists, we need to use $and to combine conditions
        query.$and = [
          { $or: query.$or },
          { $or: searchCriteria }
        ];
        delete query.$or;
      } else {
        query.$or = searchCriteria;
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    try {
      console.log('Fetching messages for user:', user.userId, 'with query:', JSON.stringify(query));
      
      // Get total count for pagination
      const total = await Message.countDocuments(query);
      console.log('Total messages found:', total);
      
      // Get messages with pagination
      const messages = await Message.find(query)
        .populate('sender', 'name')
        .populate('recipient', 'name')
        .populate('relatedTask', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      console.log('Retrieved messages count:', messages.length);
      
      // Get unread count for the inbox
      const unreadCount = await Message.countDocuments({
        recipient: user.userId,
        isRead: false
      });
      
      // Ensure messages is always an array
      const safeMessages = Array.isArray(messages) ? messages : [];
      
      return NextResponse.json({
        success: true,
        messages: safeMessages,
        unreadCount,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch messages', messages: [] },
        { status: 500 }
      );
    }
  });
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const {
        recipientId,
        subject,
        content,
        isTaskRelated,
        relatedTaskId
      } = await request.json();
      
      // Validate required fields
      if (!recipientId || !subject || !content) {
        return NextResponse.json(
          { success: false, message: 'Recipient, subject, and content are required' },
          { status: 400 }
        );
      }
      
      // Connect to database
      await connectToDatabase();
      
      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient || !recipient.isActive) {
        return NextResponse.json(
          { success: false, message: 'Recipient not found or inactive' },
          { status: 404 }
        );
      }
      
      // Validate task if it's task-related
      let task = null;
      if (isTaskRelated && relatedTaskId) {
        task = await Task.findById(relatedTaskId);
        if (!task) {
          return NextResponse.json(
            { success: false, message: 'Related task not found' },
            { status: 404 }
          );
        }
      }
      
      // Create new message
      const newMessage = new Message({
        sender: user.userId,
        recipient: recipientId,
        subject,
        content,
        isRead: false,
        isTaskRelated: isTaskRelated || false,
        relatedTask: isTaskRelated && task ? relatedTaskId : undefined
      });
      
      // Save message to database
      await newMessage.save();
      
      // Get sender information for notifications
      const sender = await User.findById(user.userId);
      const senderName = sender ? sender.name : 'A colleague';
      
      // Send email notification to recipient
      try {
        if (recipient.email) {
          // Create message preview (first 100 characters)
          const messagePreview = content.length > 100 
            ? content.substring(0, 100) 
            : content;
          
          const emailTemplate = emailTemplates.newMessage(
            recipient.name,
            senderName,
            subject,
            messagePreview
          );
          
          await sendEmail(
            recipient.email,
            emailTemplate.subject,
            emailTemplate.html
          );
        }
      } catch (emailError) {
        console.error('Error sending message notification:', emailError);
        // Continue even if email fails
      }
      
      // Send WhatsApp notification to recipient
      try {
        console.log('[WhatsApp Debug - New Message] Attempting to send WhatsApp notification for new message');
        console.log('[WhatsApp Debug - New Message] Sender:', senderName);
        console.log('[WhatsApp Debug - New Message] Recipient:', recipient.name);
        console.log('[WhatsApp Debug - New Message] Subject:', subject);
        
        const whatsappResult = await notifyNewMessage(
          recipientId,
          senderName,
          subject,
          content
        );
        
        console.log('[WhatsApp Debug - New Message] WhatsApp notification result:', whatsappResult);
        
        if (whatsappResult.success) {
          console.log(`[WhatsApp] ✅ New message notification sent successfully to ${recipient.name}`);
        } else {
          console.log(`[WhatsApp] ❌ New message notification failed for ${recipient.name}`);
          if (whatsappResult.qrCodes && whatsappResult.qrCodes.length > 0) {
            console.log(`[WhatsApp] 📱 Generated ${whatsappResult.qrCodes.length} QR codes as fallback`);
          }
        }
      } catch (whatsappError) {
        console.error('[WhatsApp Debug - New Message] Error sending WhatsApp notification:', whatsappError);
        console.error('[WhatsApp Debug - New Message] Error stack:', whatsappError.stack);
        // Continue even if WhatsApp notification fails
      }
      
      // Notify all super admins about the new message
      try {
        // Determine if the sender or recipient is a super admin to avoid duplicate notifications
        const isSenderSuperAdmin = sender && sender.role === 'SUPER_ADMIN';
        const isRecipientSuperAdmin = recipient && recipient.role === 'SUPER_ADMIN';
        
        // Only notify if neither the sender nor recipient is a super admin
        if (!isSenderSuperAdmin && !isRecipientSuperAdmin) {
          await notifyAdmins(
            'New Message Sent',
            `${senderName} sent a message to ${recipient.name}: ${subject}`,
            senderName,
            'View Messages',
            `/dashboard/messages`
          );
        }
      } catch (adminNotifyError) {
        console.error('Error notifying admins about new message:', adminNotifyError);
        // Continue even if notification fails
      }
      
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully',
        messageId: newMessage._id
      });
    } catch (error) {
      console.error('Error sending message:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to send message' },
        { status: 500 }
      );
    }
  });
} 