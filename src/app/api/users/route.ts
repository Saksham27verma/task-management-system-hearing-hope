import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { withAuth, hasRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';

// GET /api/users - Get all users (admin and managers only)
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  return withAuth(request, async (user) => {
    // Only super admin and managers can view users
    if (!hasRole(user, 'SUPER_ADMIN', 'MANAGER')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to view users' },
        { status: 403 }
      );
    }
    
    const url = new URL(request.url);
    
    // Parse query parameters
    const searchQuery = url.searchParams.get('search');
    const role = url.searchParams.get('role');
    const isActive = url.searchParams.get('isActive');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Connect to database
    await connectToDatabase();
    
    // Build query
    const query: any = {};
    
    // If not super admin, can only see non-admin users
    if (user.role !== 'SUPER_ADMIN') {
      query.role = { $ne: 'SUPER_ADMIN' };
    }
    
    // Apply role filter
    if (role) {
      query.role = role;
    }
    
    // Apply active status filter
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }
    
    // Apply search
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { position: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    try {
      // Get total count for pagination
      const total = await User.countDocuments(query);
      
      // Get users with pagination
      const users = await User.find(query, {
        password: 0, // Exclude password field
      })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);
      
      return NextResponse.json({
        success: true,
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  });
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  // Apply rate limiting with the 'sensitive' config (more restrictive)
  const rateLimited = rateLimit(request, 'sensitive');
  if (rateLimited) return rateLimited;

  return withAuth(request, async (user) => {
    // Only super admin can create users
    if (!hasRole(user, 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to create users' },
        { status: 403 }
      );
    }
    
    try {
      const {
        name,
        email,
        password,
        role,
        phone,
        position
      } = await request.json();
      
      // Validate required fields
      if (!name || !email || !password || !role || !phone || !position) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        );
      }
      
      // Validate password length
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      
      // Connect to database
      await connectToDatabase();
      
      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email already in use' },
          { status: 400 }
        );
      }
      
      // Create new user
      const newUser = new User({
        name,
        email: email.toLowerCase(),
        password, // Will be hashed in the model's pre-save hook
        role,
        phone,
        position,
        isActive: true
      });
      
      // Save user to database
      await newUser.save();
      
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        userId: newUser._id
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      );
    }
  });
} 