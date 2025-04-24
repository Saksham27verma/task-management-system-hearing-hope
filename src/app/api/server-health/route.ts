import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';

// GET /api/server-health - Check server health
export async function GET(request: NextRequest) {
  try {
    // Check MongoDB connection
    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (dbError) {
      console.error('Database connection error:', dbError);
    }
    
    // Return server health status
    return NextResponse.json({
      success: true,
      status: 'active',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected
      },
      environment: {
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Error checking server health:', error);
    return NextResponse.json(
      { success: false, message: 'Error checking server health' },
      { status: 500 }
    );
  }
} 