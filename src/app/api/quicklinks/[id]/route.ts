import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import QuickLink from '@/models/QuickLink';

// GET /api/quicklinks/[id] - Get a specific quick link
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const linkId = params.id;
      
      await connectToDatabase();
      
      // Find link with specific conditions
      const link = await QuickLink.findOne({
        _id: linkId,
        $or: [
          { userId: user.userId },
          { isPublic: true }
        ]
      }).lean();
      
      if (!link) {
        return NextResponse.json(
          { success: false, message: 'Quick link not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        link
      });
    } catch (error) {
      console.error('Error fetching quick link:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch quick link' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/quicklinks/[id] - Update a quick link
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    try {
      const linkId = params.id;
      const updates = await request.json();
      
      await connectToDatabase();
      
      // Find link and ensure ownership (unless super admin)
      const query = user.role === 'SUPER_ADMIN'
        ? { _id: linkId }
        : { _id: linkId, userId: user.userId };
      
      // Update allowed fields only
      const allowedUpdates = [
        'title', 'url', 'description', 'category', 
        'icon', 'color', 'order', 'isPublic'
      ];
      
      const updateData: any = {};
      
      allowedUpdates.forEach(field => {
        if (field in updates) {
          updateData[field] = updates[field];
        }
      });
      
      // Add updatedAt timestamp
      updateData.updatedAt = Date.now();
      
      const updatedLink = await QuickLink.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!updatedLink) {
        return NextResponse.json(
          { success: false, message: 'Quick link not found or not authorized to update' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Quick link updated successfully',
        link: updatedLink
      });
    } catch (error) {
      console.error('Error updating quick link:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update quick link' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/quicklinks/[id] - Delete a quick link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    try {
      const linkId = params.id;
      
      await connectToDatabase();
      
      // Find link and ensure ownership (unless super admin)
      const query = user.role === 'SUPER_ADMIN'
        ? { _id: linkId }
        : { _id: linkId, userId: user.userId };
      
      const deletedLink = await QuickLink.findOneAndDelete(query);
      
      if (!deletedLink) {
        return NextResponse.json(
          { success: false, message: 'Quick link not found or not authorized to delete' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Quick link deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting quick link:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete quick link' },
        { status: 500 }
      );
    }
  });
} 