import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notice from '@/models/Notice';
import { withAuth, hasRole } from '@/lib/auth';

// GET /api/notices/[id] - Get a specific notice by ID
export async function GET(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      const notice = await Notice.findById(id)
        .populate('postedBy', 'name');
      
      if (!notice) {
        return NextResponse.json(
          { success: false, message: 'Notice not found' },
          { status: 404 }
        );
      }
      
      // Check if notice is expired
      if (notice.expiryDate && new Date(notice.expiryDate) < new Date()) {
        return NextResponse.json(
          { success: false, message: 'This notice has expired' },
          { status: 410 } // Gone status code
        );
      }
      
      return NextResponse.json({
        success: true,
        notice
      });
    } catch (error) {
      console.error(`Error fetching notice ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch notice' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/notices/[id] - Update a notice
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  return withAuth(request, async (user) => {
    // Only super admin and managers can update notices
    if (!hasRole(user, 'SUPER_ADMIN', 'MANAGER')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update notices' },
        { status: 403 }
      );
    }
    
    try {
      const {
        title,
        content,
        attachmentUrl,
        isImportant,
        expiryDate
      } = await request.json();
      
      await connectToDatabase();
      
      // Find the notice
      const notice = await Notice.findById(id);
      
      if (!notice) {
        return NextResponse.json(
          { success: false, message: 'Notice not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission (only original poster or super admin)
      const isOriginalPoster = notice.postedBy.toString() === user.userId;
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      
      if (!isOriginalPoster && !isSuperAdmin) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to update this notice' },
          { status: 403 }
        );
      }
      
      // Update notice fields
      if (title) notice.title = title;
      if (content) notice.content = content;
      if (attachmentUrl !== undefined) notice.attachmentUrl = attachmentUrl;
      if (isImportant !== undefined) notice.isImportant = isImportant;
      if (expiryDate !== undefined) {
        notice.expiryDate = expiryDate ? new Date(expiryDate) : undefined;
      }
      
      // Save updated notice
      await notice.save();
      
      return NextResponse.json({
        success: true,
        message: 'Notice updated successfully'
      });
    } catch (error) {
      console.error(`Error updating notice ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to update notice' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/notices/[id] - Delete a notice
export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  return withAuth(request, async (user) => {
    // Only super admin and managers can delete notices
    if (!hasRole(user, 'SUPER_ADMIN', 'MANAGER')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete notices' },
        { status: 403 }
      );
    }
    
    try {
      await connectToDatabase();
      
      // Find the notice
      const notice = await Notice.findById(id);
      
      if (!notice) {
        return NextResponse.json(
          { success: false, message: 'Notice not found' },
          { status: 404 }
        );
      }
      
      // Check if user has permission (only original poster or super admin)
      const isOriginalPoster = notice.postedBy.toString() === user.userId;
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      
      if (!isOriginalPoster && !isSuperAdmin) {
        return NextResponse.json(
          { success: false, message: 'Not authorized to delete this notice' },
          { status: 403 }
        );
      }
      
      // Delete the notice
      await Notice.findByIdAndDelete(id);
      
      return NextResponse.json({
        success: true,
        message: 'Notice deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting notice ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete notice' },
        { status: 500 }
      );
    }
  });
} 