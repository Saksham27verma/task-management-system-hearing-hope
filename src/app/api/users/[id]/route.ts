import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { withAuth, hasRole } from '@/lib/auth';

// GET /api/users/[id] - Get a specific user by ID
export async function GET(
  request: NextRequest,
  { params }: any
) {
  return withAuth(request, async (user) => {
    // Only super admin and managers can view user details
    if (!hasRole(user, 'SUPER_ADMIN', 'MANAGER')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to view user details' },
        { status: 403 }
      );
    }
    
    // Users can view their own details
    const isSameUser = user.userId === params.id;
    
    // Managers cannot view super admin details
    if (user.role === 'MANAGER' && !isSameUser) {
      // Need to check if requested user is a super admin
      try {
        await connectToDatabase();
        
        const targetUser = await User.findById(params.id, { role: 1 });
        if (targetUser && targetUser.role === 'SUPER_ADMIN') {
          return NextResponse.json(
            { success: false, message: 'Not authorized to view this user' },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    }
    
    try {
      await connectToDatabase();
      
      const userDetails = await User.findById(params.id, {
        password: 0, // Exclude password
      });
      
      if (!userDetails) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user: userDetails
      });
    } catch (error) {
      console.error(`Error fetching user ${params.id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user details' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  return withAuth(request, async (user) => {
    const isSameUser = user.userId === params.id;
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    
    // Check permission: users can update their own details, super admins can update anyone
    if (!isSameUser && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this user' },
        { status: 403 }
      );
    }
    
    try {
      const {
        name,
        email,
        phone,
        position,
        role,
        isActive,
        password
      } = await request.json();
      
      await connectToDatabase();
      
      // Find the user
      const userToUpdate = await User.findById(params.id);
      
      if (!userToUpdate) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Users can't change their own role or active status
      if (isSameUser && !isSuperAdmin) {
        if (role && role !== userToUpdate.role) {
          return NextResponse.json(
            { success: false, message: 'You cannot change your own role' },
            { status: 403 }
          );
        }
        
        if (isActive !== undefined && isActive !== userToUpdate.isActive) {
          return NextResponse.json(
            { success: false, message: 'You cannot change your own active status' },
            { status: 403 }
          );
        }
      }
      
      // Validate email if changing
      if (email && email !== userToUpdate.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { success: false, message: 'Invalid email format' },
            { status: 400 }
          );
        }
        
        // Check if email is already in use
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: params.id }  // Exclude current user
        });
        
        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'Email already in use' },
            { status: 400 }
          );
        }
        
        userToUpdate.email = email.toLowerCase();
      }
      
      // Update fields
      if (name) userToUpdate.name = name;
      if (phone) userToUpdate.phone = phone;
      if (position) userToUpdate.position = position;
      
      // Only super admin can change role and active status
      if (isSuperAdmin) {
        if (role) userToUpdate.role = role;
        if (isActive !== undefined) userToUpdate.isActive = isActive;
      }
      
      // Update password if provided
      if (password) {
        if (password.length < 6) {
          return NextResponse.json(
            { success: false, message: 'Password must be at least 6 characters' },
            { status: 400 }
          );
        }
        
        userToUpdate.password = password; // Will be hashed in the model's pre-save hook
      }
      
      // Save the user
      await userToUpdate.save();
      
      return NextResponse.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error(`Error updating user ${params.id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/users/[id] - Delete a user (actually delete from database)
export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  return withAuth(request, async (user) => {
    // Only super admins can delete users
    if (!hasRole(user, 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete users' },
        { status: 403 }
      );
    }
    
    // Prevent self-deletion
    if (user.userId === params.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }
    
    try {
      await connectToDatabase();
      
      const userToDelete = await User.findById(params.id);
      
      if (!userToDelete) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }
      
      // Prevent deletion of other super admins
      if (userToDelete.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, message: 'Cannot delete another super admin account' },
          { status: 403 }
        );
      }
      
      // Actually delete the user from the database
      await User.findByIdAndDelete(params.id);
      
      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error(`Error deleting user ${params.id}:`, error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete user' },
        { status: 500 }
      );
    }
  });
} 