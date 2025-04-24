import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('GET /api/auth/me called');
  
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    let token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // If no token in header, try to get from cookie
    if (!token) {
      console.log('No Authorization header found, checking cookies');
      // Try to get from cookie safely
      try {
        const cookie = request.cookies.get('auth_token');
        token = cookie ? cookie.value : null;
        console.log('Cookie auth_token present:', !!token);
      } catch (e) {
        console.error('Error accessing cookies:', e);
      }
    }
    
    if (!token) {
      console.log('No token found in request');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify token
    console.log('Verifying token');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('Token verification failed');
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    console.log(`Token verified for user ID: ${decoded.userId}`);
    
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
    
    // Find user by id
    console.log(`Finding user with ID: ${decoded.userId}`);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      console.log(`User not found or inactive: ${decoded.userId}`);
      return NextResponse.json(
        { success: false, message: 'User not found or inactive' },
        { status: 404 }
      );
    }
    
    console.log(`User found: ${user.email}`);
    
    // Return user data (without password)
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
      },
    });
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
} 