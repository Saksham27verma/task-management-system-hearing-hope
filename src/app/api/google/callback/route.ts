import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import GoogleCalendarToken from '@/models/GoogleCalendarToken';
import { verifyToken } from '@/lib/auth';

// GET /api/google/callback - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // Contains userId
    
    // Handle errors from Google
    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?error=${error}`);
    }
    
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?error=missing_code`);
    }
    
    if (!state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?error=invalid_state`);
    }
    
    // Get the client ID and secret
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?error=oauth_config_missing`);
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?error=token_exchange_failed`);
    }
    
    // Extract tokens
    const { access_token, refresh_token, expires_in } = tokenData;
    
    if (!access_token) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?error=missing_access_token`);
    }
    
    // Connect to database
    await connectToDatabase();
    
    try {
      // Find existing token for this user and handle with try/catch
      let existingToken = null;
      try {
        existingToken = await GoogleCalendarToken.findOne({ userId: state }).exec();
      } catch (findError) {
        console.error('Error finding token:', findError);
      }
      
      if (existingToken) {
        // Update existing token
        existingToken.accessToken = access_token;
        if (refresh_token) {
          existingToken.refreshToken = refresh_token;
        }
        existingToken.expiresAt = new Date(Date.now() + expires_in * 1000);
        await existingToken.save();
      } else {
        // Create new token record
        const newToken = new GoogleCalendarToken({
          userId: state,
          accessToken: access_token,
          refreshToken: refresh_token || '', 
          expiresAt: new Date(Date.now() + expires_in * 1000),
          syncSettings: {
            taskTypes: ['DAILY', 'WEEKLY', 'MONTHLY'],
            syncFrequency: 'daily',
          },
        });
        
        await newToken.save();
      }
      
      // Redirect back to calendar page with success
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?connected=true`);
    } catch (dbError) {
      console.error('Database error saving tokens:', dbError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?error=database_error`);
    }
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/calendar?error=server_error`);
  }
} 