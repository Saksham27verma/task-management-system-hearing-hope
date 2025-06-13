import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notice from '@/models/Notice';
import User from '@/models/User';
import { withAuth, hasRole } from '@/lib/auth';
import { sendEmail, emailTemplates, notifyAdmins } from '@/lib/email';
import { notifyNewNotice } from '@/lib/whatsapp';
import Notification from '@/models/Notification';

// GET /api/notices - Get all notices
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const url = new URL(request.url);
    
    // Parse query parameters
    const searchQuery = url.searchParams.get('search');
    const isImportant = url.searchParams.get('isImportant');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Connect to database
    await connectToDatabase();
    
    // Build query
    const query: any = {};
    
    // Apply importance filter
    if (isImportant !== null) {
      query.isImportant = isImportant === 'true';
    }
    
    // Apply search filter
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Add filter for expired notices
    const today = new Date();
    query.$or = query.$or || [];
    query.$or.push(
      { expiryDate: { $exists: false } },
      { expiryDate: { $gt: today } }
    );
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    try {
      // Get total count for pagination
      const total = await Notice.countDocuments(query);
      
      // Get notices with pagination
      const notices = await Notice.find(query)
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return NextResponse.json({
        success: true,
        notices,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching notices:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch notices' },
        { status: 500 }
      );
    }
  });
}

// POST /api/notices - Create a new notice
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    // Only super admin and managers can create notices
    if (!hasRole(user, 'SUPER_ADMIN', 'MANAGER')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to create notices' },
        { status: 403 }
      );
    }
    
    try {
      const {
        title,
        content,
        attachmentUrl,
        isImportant,
        expiryDate,
        sendNotification
      } = await request.json();
      
      // Validate required fields
      if (!title || !content) {
        return NextResponse.json(
          { success: false, message: 'Title and content are required' },
          { status: 400 }
        );
      }
      
      // Connect to database
      await connectToDatabase();
      
      // Get the poster's information
      const postedByUser = await User.findById(user.userId, 'name role');
      const posterName = postedByUser ? postedByUser.name : 'Administrator';
      const isPosterSuperAdmin = postedByUser && postedByUser.role === 'SUPER_ADMIN';
      
      // Create new notice
      const newNotice = new Notice({
        title,
        content,
        postedBy: user.userId,
        attachmentUrl: attachmentUrl || undefined,
        isImportant: isImportant || false,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined
      });
      
      // Save notice to database
      await newNotice.save();
      
      // Send email notification if requested
      if (sendNotification) {
        try {
          // Get all active users
          const users = await User.find({ isActive: true }, 'name email phone');
          
          if (users.length > 0) {
            // Prepare email recipients
            const recipients = users.map(user => user.email);
            
            // Create and send email
            const emailTemplate = emailTemplates.newNotice(
              'Team Member', // Generic salutation
              title,
              content.substring(0, 200) + (content.length > 200 ? '...' : ''),
              posterName
            );
            
            await sendEmail(
              recipients,
              emailTemplate.subject,
              emailTemplate.html
            );
            
            // Send in-app notifications to all users
            for (const recipient of users) {
              try {
                const notification = new Notification({
                  userId: recipient._id.toString(),
                  type: 'notice',
                  title: 'New Notice Posted',
                  message: title,
                  link: `/dashboard/notices`,
                  read: false,
                  createdAt: new Date()
                });
                
                await notification.save();
              } catch (notifyError) {
                console.error('Error creating in-app notification:', notifyError);
              }
            }
            
            // Send WhatsApp notifications for important notices or if explicitly requested
            try {
              console.log(`[WhatsApp Debug - Notices] Starting WhatsApp notification process`);
              console.log(`[WhatsApp Debug - Notices] ENABLE_WHATSAPP_NOTIFICATIONS =`, process.env.ENABLE_WHATSAPP_NOTIFICATIONS);
              console.log(`[WhatsApp Debug - Notices] Title: ${title}`);
              console.log(`[WhatsApp Debug - Notices] Important: ${isImportant}`);
              console.log(`[WhatsApp Debug - Notices] SendNotification: ${sendNotification}`);
              console.log(`[WhatsApp Debug - Notices] Poster: ${posterName}`);
              console.log(`[WhatsApp Debug - Notices] Users count: ${users.length}`);
              
              // Check how many users have phone numbers
              const usersWithPhone = users.filter(user => user.phone && user.phone.trim() !== '');
              console.log(`[WhatsApp Debug - Notices] Users with phone numbers: ${usersWithPhone.length}`);
              
              if (usersWithPhone.length === 0) {
                console.log(`[WhatsApp Debug - Notices] ❌ No users have phone numbers! Cannot send WhatsApp notifications`);
                console.log(`[WhatsApp Debug - Notices] Sample user data:`, users.slice(0, 2).map(u => ({ name: u.name, email: u.email, phone: u.phone })));
              } else {
                console.log(`[WhatsApp Debug - Notices] ✅ Found ${usersWithPhone.length} users with phone numbers`);
                console.log(`[WhatsApp Debug - Notices] Sample users with phones:`, usersWithPhone.slice(0, 2).map(u => ({ name: u.name, phone: u.phone })));
              }
              
              // Send to all users if it's an important notice, or if notifications are requested
              if (isImportant || sendNotification) {
                console.log(`[WhatsApp Debug - Notices] Conditions met for WhatsApp notifications - proceeding...`);
                
                // Get all user IDs for WhatsApp notifications (only users with phone numbers)
                const usersWithPhones = users.filter(user => user.phone && user.phone.trim() !== '');
                const userIds = usersWithPhones.map(user => user._id.toString());
                console.log(`[WhatsApp Debug - Notices] Sending to ${userIds.length} users with phones:`, userIds);
                
                if (userIds.length === 0) {
                  console.log(`[WhatsApp Debug - Notices] ❌ No users have phone numbers - skipping WhatsApp notifications`);
                } else {
                  const result = await notifyNewNotice(
                    title,
                    content,
                    posterName,
                    isImportant || false,
                    userIds // Pass only users who have phone numbers
                  );
                  
                  console.log(`[WhatsApp Debug - Notices] notifyNewNotice result:`, result);
                  
                  if (result.success) {
                    console.log(`[WhatsApp] ✅ Notice notifications sent successfully for: ${title}`);
                  } else {
                    console.log(`[WhatsApp] ❌ Notice notifications failed for: ${title}`);
                    if (result.qrCodes && result.qrCodes.length > 0) {
                      console.log(`[WhatsApp] 📱 Generated ${result.qrCodes.length} QR codes as fallback`);
                    }
                  }
                }
              } else {
                console.log(`[WhatsApp Debug - Notices] Conditions not met for WhatsApp notifications - Important: ${isImportant}, SendNotification: ${sendNotification}`);
              }
            } catch (whatsappError) {
              console.error('[WhatsApp Debug - Notices] Error sending WhatsApp notifications:', whatsappError);
              console.error('[WhatsApp Debug - Notices] Error stack:', whatsappError.stack);
              // Continue even if WhatsApp notifications fail
            }
          }
        } catch (emailError) {
          console.error('Error sending notice notifications:', emailError);
          // Continue even if email fails
        }
      }
      
      // Notify all super admins about the new notice if the poster is not a super admin
      if (!isPosterSuperAdmin) {
        try {
          await notifyAdmins(
            'New Notice Posted',
            `${posterName} posted a new notice: ${title}`,
            posterName,
            'View Notice',
            `/dashboard/notices`
          );
        } catch (adminNotifyError) {
          console.error('Error notifying admins about new notice:', adminNotifyError);
          // Continue even if notification fails
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Notice created successfully',
        noticeId: newNotice._id
      });
    } catch (error) {
      console.error('Error creating notice:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create notice' },
        { status: 500 }
      );
    }
  });
} 