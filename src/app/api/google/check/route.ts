import { NextRequest, NextResponse } from 'next/server';

// GET /api/google/check - Check Google OAuth configuration
export async function GET(request: NextRequest) {
  try {
    // Check if required environment variables are set
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    // Return configuration status
    return NextResponse.json({
      success: true,
      config: {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        nextAuthUrl: !!nextAuthUrl,
        clientIdValue: clientId ? `${clientId.substring(0, 10)}...` : null,
        redirectUri: nextAuthUrl ? `${nextAuthUrl}/api/google/callback` : null
      }
    });
  } catch (error) {
    console.error('Error checking Google configuration:', error);
    return NextResponse.json(
      { success: false, message: 'Error checking Google configuration' },
      { status: 500 }
    );
  }
} 