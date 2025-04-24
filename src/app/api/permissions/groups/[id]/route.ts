import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PermissionGroup from '@/models/Permission';
import { withPermission } from '@/lib/auth';

type RouteParams = {
  id: string;
};

// GET /api/permissions/groups/[id] - Get a specific permission group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { id } = await params;
  
  return withPermission(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Get the permission group
      const group = await PermissionGroup.findById(id).lean();
      
      if (!group) {
        return NextResponse.json(
          { success: false, message: 'Permission group not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        group
      });
    } catch (error) {
      console.error(`Error fetching permission group ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch permission group' },
        { status: 500 }
      );
    }
  }, 'users:read');
}

// PUT /api/permissions/groups/[id] - Update a permission group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { id } = await params;
  
  return withPermission(request, async (user) => {
    try {
      const { name, description, permissions } = await request.json();
      
      await connectToDatabase();
      
      // Find the group
      const group = await PermissionGroup.findById(id);
      
      if (!group) {
        return NextResponse.json(
          { success: false, message: 'Permission group not found' },
          { status: 404 }
        );
      }
      
      // Update fields if provided
      if (name) group.name = name;
      if (description !== undefined) group.description = description;
      if (permissions && Array.isArray(permissions)) group.permissions = permissions;
      
      // Save updated group
      await group.save();
      
      return NextResponse.json({
        success: true,
        message: 'Permission group updated successfully'
      });
    } catch (error) {
      console.error(`Error updating permission group ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to update permission group' },
        { status: 500 }
      );
    }
  }, 'users:update');
}

// DELETE /api/permissions/groups/[id] - Delete a permission group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { id } = await params;
  
  return withPermission(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Find and delete the group
      const result = await PermissionGroup.findByIdAndDelete(id);
      
      if (!result) {
        return NextResponse.json(
          { success: false, message: 'Permission group not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Permission group deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting permission group ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete permission group' },
        { status: 500 }
      );
    }
  }, 'users:delete');
} 