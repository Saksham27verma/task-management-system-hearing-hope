import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

// GET /api/google/auth - Get Google OAuth URL
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Google OAuth 2.0 endpoint
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/google/callback`;
      
      if (!clientId) {
        return NextResponse.json(
          { success: false, message: 'Google OAuth not configured' },
          { status: 500 }
        );
      }
      
      // Create OAuth authorization URL
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events');
      const responseType = 'code';
      const accessType = 'offline';
      const prompt = 'consent'; // Force to show consent screen to get refresh token
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${scope}&access_type=${accessType}&prompt=${prompt}&state=${user.userId}`;
      
      return NextResponse.json({
        success: true,
        authUrl
      });
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to generate authentication URL' },
        { status: 500 }
      );
    }
  });
} 