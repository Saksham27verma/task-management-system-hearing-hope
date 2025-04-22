import { NextRequest, NextResponse } from 'next/server';
import { ROLE_PERMISSIONS } from '@/types/permissions';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

// GET /api/system/fix-permissions - Emergency fix for permissions
export async function GET(request: NextRequest) {
  try {
    // For security, only allow this endpoint to be called from the same origin
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    
    if (!origin.includes(host) && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('Starting emergency permissions fix...');
    await connectToDatabase();
    
    // Get user ID from the query parameters or use the authenticated user
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    let fixedCount = 0;
    
    if (userId) {
      // Fix permissions for a specific user
      const user = await User.findById(userId);
      
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Assign role-based permissions
      const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
      
      // Add permissions to the user
      user.customPermissions = [...Array.from(new Set([
        ...(user.customPermissions || []),
        ...rolePermissions
      ]))];
      
      await user.save();
      fixedCount = 1;
      
      return NextResponse.json({
        success: true,
        message: `Permissions fixed for user ${user.name}`,
        permissions: user.customPermissions
      });
    } else {
      // Fix permissions for all users
      const users = await User.find();
      
      for (const user of users) {
        const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
        
        // Add permissions to the user
        user.customPermissions = [...Array.from(new Set([
          ...(user.customPermissions || []),
          ...rolePermissions
        ]))];
        
        await user.save();
        fixedCount++;
      }
      
      return NextResponse.json({
        success: true,
        message: `Permissions fixed for ${fixedCount} users`,
        count: fixedCount
      });
    }
  } catch (error) {
    console.error('Error fixing permissions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fix permissions' },
      { status: 500 }
    );
  }
} 