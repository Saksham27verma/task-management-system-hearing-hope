import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import PermissionGroup from '@/models/Permission';
import { withPermission } from '@/lib/auth';
import { getUserPermissions } from '@/lib/permissions';

type RouteParams = {
  id: string;
};

// GET /api/users/[id]/permissions - Get user permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { id } = await params;
  
  return withPermission(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Get user permissions
      const permissions = await getUserPermissions(id);
      console.log(`Retrieved ${permissions.length} permissions for user ${id}`);
      
      return NextResponse.json({
        success: true,
        permissions
      });
    } catch (error) {
      console.error(`Error fetching permissions for user ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user permissions' },
        { status: 500 }
      );
    }
  }, 'users:read');
}

// PUT /api/users/[id]/permissions - Update user permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { id } = await params;
  
  return withPermission(request, async (user) => {
    try {
      const { customPermissions, permissionGroups } = await request.json();
      console.log(`Updating permissions for user ${id}`, { customPermissions, permissionGroups });
      
      await connectToDatabase();
      
      // Find the user
      const userToUpdate = await User.findById(id);
      
      if (!userToUpdate) {
        console.error(`User ${id} not found`);
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Update custom permissions if provided
      if (Array.isArray(customPermissions)) {
        console.log(`Setting ${customPermissions.length} custom permissions for user ${id}`);
        userToUpdate.customPermissions = customPermissions;
      }
      
      // Update permission groups if provided
      if (Array.isArray(permissionGroups)) {
        console.log(`Setting ${permissionGroups.length} permission groups for user ${id}`);
        userToUpdate.permissionGroups = permissionGroups;
      }
      
      // Save updated user
      await userToUpdate.save();
      console.log(`Successfully updated permissions for user ${id}`);
      
      return NextResponse.json({
        success: true,
        message: 'User permissions updated successfully'
      });
    } catch (error) {
      console.error(`Error updating permissions for user ${id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to update user permissions' },
        { status: 500 }
      );
    }
  }, 'users:update');
} 