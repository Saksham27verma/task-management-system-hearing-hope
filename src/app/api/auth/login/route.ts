import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { createToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { bootstrapUserPermissions } from '@/lib/permissionBootstrap';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Apply rate limiting to login attempts
  const rateLimited = rateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  try {
    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createToken(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Bootstrap user permissions to ensure they have all required permissions
    try {
      await bootstrapUserPermissions(user._id.toString());
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