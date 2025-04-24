import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

// GET - Return available fields for reports
// This is a placeholder route to maintain compatibility after removing custom reports feature
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Return empty fields structure
      return NextResponse.json({
        success: true,
        fields: {
          task: [],
          user: []
        }
      });
    } catch (error) {
      console.error('Error fetching available fields:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch available fields' },
        { status: 500 }
      );
    }
  });
} 