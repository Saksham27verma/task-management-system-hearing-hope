import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/lib/auth';

// Interface for the custom report
interface CustomReportField {
  field: string;
  label: string;
  selected: boolean;
}

interface CustomReportFilter {
  field: string;
  operator: string;
  value: string;
}

interface CustomReport {
  _id?: ObjectId | string;
  name: string;
  description: string;
  type: string;
  fields: CustomReportField[];
  filters: CustomReportFilter[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

// GET: Fetch custom reports
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { db } = await connectToDatabase();
      
      // Get query parameters
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      const type = url.searchParams.get('type');
      
      // If an ID is provided, return a specific report
      if (id) {
        try {
          const report = await db.collection('customReports').findOne({
            _id: new ObjectId(id),
            $or: [
              { createdBy: user.email },
              { isPublic: true }
            ]
          });
          
          if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
          }
          
          return NextResponse.json({ report });
        } catch (error) {
          return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 });
        }
      }
      
      // Build the query based on filter params
      const query: any = {
        $or: [
          { createdBy: user.email },
          { isPublic: true }
        ]
      };
      
      // Filter by report type if provided
      if (type) {
        query.type = type;
      }
      
      // Fetch the reports
      const reports = await db.collection('customReports')
        .find(query)
        .sort({ updatedAt: -1 })
        .toArray();
      
      return NextResponse.json({ reports });
      
    } catch (error) {
      console.error('Error fetching custom reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch custom reports' },
        { status: 500 }
      );
    }
  });
}

// POST: Create a new custom report
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { db } = await connectToDatabase();
      
      // Parse the request body
      const data = await request.json();
      
      // Validate required fields
      if (!data.name?.trim()) {
        return NextResponse.json({ error: 'Report name is required' }, { status: 400 });
      }
      
      if (!data.type) {
        return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
      }
      
      if (!data.fields || !Array.isArray(data.fields) || !data.fields.some(field => field.selected)) {
        return NextResponse.json({ error: 'At least one field must be selected' }, { status: 400 });
      }
      
      // Create the report object without _id field for MongoDB to generate
      const now = new Date();
      const report = {
        name: data.name.trim(),
        description: data.description || '',
        type: data.type,
        fields: data.fields,
        filters: data.filters || [],
        sortBy: data.sortBy,
        createdBy: user.email,
        createdAt: now,
        updatedAt: now,
        isPublic: !!data.isPublic
      };
      
      // Insert the report into the database
      const result = await db.collection('customReports').insertOne(report);
      
      if (!result.insertedId) {
        return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
      }
      
      // Return the saved report with the generated ID
      return NextResponse.json({ 
        message: 'Report saved successfully',
        report: { ...report, _id: result.insertedId }
      }, { status: 201 });
      
    } catch (error) {
      console.error('Error creating custom report:', error);
      return NextResponse.json(
        { error: 'Failed to create custom report' },
        { status: 500 }
      );
    }
  });
} 