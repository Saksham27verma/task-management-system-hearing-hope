import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import QuickLink from '@/models/QuickLink';

// GET /api/quicklinks - Get all quick links for a user
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const category = searchParams.get('category');
      const isPublic = searchParams.get('public') === 'true';
      
      await connectToDatabase();
      
      // Build query
      let query: any = { userId: user.userId };
      
      // Add category filter if provided
      if (category) {
        query.category = category;
      }
      
      // If requesting public links and user is admin/manager
      if (isPublic && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER')) {
        query = { isPublic: true };
      }
      
      // Get links and sort by order then creation date
      const links = await QuickLink.find(query)
        .sort({ order: 1, createdAt: -1 })
        .lean();
      
      return NextResponse.json({
        success: true,
        links
      });
    } catch (error) {
      console.error('Error fetching quick links:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch quick links' },
        { status: 500 }
      );
    }
  });
}

// POST /api/quicklinks - Create a new quick link
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    try {
      const body = await request.json();
      
      await connectToDatabase();
      
      // Create new link
      const newLink = new QuickLink({
        userId: user.userId,
        title: body.title,
        url: body.url,
        description: body.description || '',
        category: body.category || 'General',
        icon: body.icon || 'link',
        color: body.color || '#1976d2',
        order: body.order || 0,
        isPublic: body.isPublic || false
      });
      
      await newLink.save();
      
      return NextResponse.json({
        success: true,
        message: 'Quick link created successfully',
        link: newLink
      });
    } catch (error) {
      console.error('Error creating quick link:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create quick link' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/quicklinks - Delete multiple quick links
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    try {
      const { linkIds } = await request.json();
      
      if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No link IDs provided' },
          { status: 400 }
        );
      }
      
      await connectToDatabase();
      
      // Only delete links owned by the user, or all links if super admin
      const query = user.role === 'SUPER_ADMIN' 
        ? { _id: { $in: linkIds } }
        : { _id: { $in: linkIds }, userId: user.userId };
      
      const result = await QuickLink.deleteMany(query);
      
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} quick links deleted successfully`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error deleting quick links:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete quick links' },
        { status: 500 }
      );
    }
  });
} 