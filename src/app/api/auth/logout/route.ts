import { NextResponse } from 'next/server';

export async function POST() {
  console.log('POST /api/auth/logout called');
  
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
    
    console.log('Clearing auth_token cookie');
    
    // Clear the auth cookie by setting an expired date
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0),
    });
    
    console.log('Logout successful');
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during logout' },
      { status: 500 }
    );
  }
} 