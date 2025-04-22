import { NextResponse } from 'next/server';

export async function POST() {
  // Create response
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
  
  // Clear the auth cookie by setting an expired date
  response.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    path: '/',
    expires: new Date(0),
  });
  
  return response;
} 