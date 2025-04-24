import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { createToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { bootstrapUserPermissions } from '@/lib/permissionBootstrap';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('Login API called');
  
  // Apply rate limiting to login attempts
  const rateLimited = rateLimit(request, 'auth');
  if (rateLimited) {
    console.log('Rate limit exceeded for login attempt');
    return rateLimited;
  }

  try {
    const { email, password } = await request.json();
    console.log(`Login attempt for email: ${email}`);

    // Validate inputs
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    console.log('Connecting to database');
    try {
      await connectToDatabase();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500 }
      );
    }

    // Find user by email
    console.log(`Finding user with email: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`User account is inactive: ${email}`);
      return NextResponse.json(
        { success: false, message: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    // Compare passwords
    console.log('Comparing passwords');
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${email}`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log(`Login successful for user: ${email}`);
    
    // Create JWT token
    const token = createToken(user);
    console.log('JWT token created');

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    console.log('Last login updated');

    // Bootstrap user permissions to ensure they have all required permissions
    try {
      console.log('Bootstrapping user permissions');
      await bootstrapUserPermissions(user._id.toString());
      console.log('User permissions bootstrapped successfully');
    } catch (permError) {
      console.error('Error bootstrapping user permissions:', permError);
      // Continue anyway - this is not critical for login
    }

    // Create response with the token in a cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
      },
    });

    // Set the auth token cookie
    console.log('Setting auth_token cookie');
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 