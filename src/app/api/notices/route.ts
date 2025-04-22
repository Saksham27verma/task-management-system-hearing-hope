import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notice from '@/models/Notice';
import User from '@/models/User';
import { withAuth, hasRole } from '@/lib/auth';
import { sendEmail, emailTemplates } from '@/lib/email';

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
          const users = await User.find({ isActive: true }, 'name email');
          const postedByUser = await User.findById(user.userId, 'name');
          
          if (users.length > 0) {
            // Prepare email recipients
            const recipients = users.map(user => user.email);
            
            // Create and send email
            const emailTemplate = emailTemplates.newNotice(
              'Team Member', // Generic salutation
              title,
              content.substring(0, 200) + (content.length > 200 ? '...' : ''),
              postedByUser ? postedByUser.name : 'Administrator'
            );
            
            await sendEmail(
              recipients,
              emailTemplate.subject,
              emailTemplate.html
            );
          }
        } catch (emailError) {
          console.error('Error sending notice notifications:', emailError);
          // Continue even if email fails
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