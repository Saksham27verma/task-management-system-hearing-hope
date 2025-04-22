import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { bootstrapPermissions, bootstrapUserPermissions } from '@/lib/permissionBootstrap';

// POST /api/bootstrap-permissions - Bootstrap permissions for all users or a specific user
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Only super admins can bootstrap permissions
      if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, message: 'Not authorized to bootstrap permissions' },
          { status: 403 }
        );
      }

      // Check if a specific user ID was provided in the request
      const { userId } = await request.json().catch(() => ({}));
      let result;

      if (userId) {
        // Bootstrap permissions for a specific user
        result = await bootstrapUserPermissions(userId);
      } else {
        // Bootstrap permissions for all users
        result = await bootstrapPermissions();
      }

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error in bootstrap permissions endpoint:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to bootstrap permissions' },
        { status: 500 }
      );
    }
  });
}

// GET /api/bootstrap-permissions - Bootstrap permissions for the current user
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Bootstrap permissions for the current user
      const result = await bootstrapUserPermissions(user.userId);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Your permissions have been updated',
        permissions: result.permissions
      });
    } catch (error) {
      console.error('Error bootstrapping current user permissions:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update your permissions' },
        { status: 500 }
      );
    }
  });
} 