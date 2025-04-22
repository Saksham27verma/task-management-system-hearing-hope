import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PermissionGroup from '@/models/Permission';
import { withPermission } from '@/lib/auth';

// GET /api/permissions/groups - Get all permission groups
export async function GET(request: NextRequest) {
  return withPermission(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Get all permission groups
      const groups = await PermissionGroup.find().lean();
      
      return NextResponse.json({
        success: true,
        groups
      });
    } catch (error) {
      console.error('Error fetching permission groups:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch permission groups' },
        { status: 500 }
      );
    }
  }, 'users:read');
}

// POST /api/permissions/groups - Create a new permission group
export async function POST(request: NextRequest) {
  return withPermission(request, async (user) => {
    try {
      const { name, description, permissions } = await request.json();
      
      // Validate required fields
      if (!name || !permissions || !Array.isArray(permissions)) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      await connectToDatabase();
      
      // Check if group with the same name already exists
      const existingGroup = await PermissionGroup.findOne({ name });
      
      if (existingGroup) {
        return NextResponse.json(
          { success: false, message: 'Permission group with this name already exists' },
          { status: 400 }
        );
      }
      
      // Create new permission group
      const newGroup = new PermissionGroup({
        name,
        description,
        permissions,
        createdBy: user.userId
      });
      
      // Save group
      await newGroup.save();
      
      return NextResponse.json({
        success: true,
        message: 'Permission group created successfully',
        groupId: newGroup._id
      });
    } catch (error) {
      console.error('Error creating permission group:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create permission group' },
        { status: 500 }
      );
    }
  }, 'users:create');
} 