import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/lib/auth';

// PUT: Update a custom report
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  return withAuth(request, async (user) => {
    try {
      const { db } = await connectToDatabase();
      
      // Parse the request body
      const data = await request.json();
      
      // Validate required fields
      if (!data.name?.trim()) {
        return NextResponse.json({ error: 'Report name is required' }, { status: 400 });
      }
      
      if (!data.fields || !Array.isArray(data.fields) || !data.fields.some(field => field.selected)) {
        return NextResponse.json({ error: 'At least one field must be selected' }, { status: 400 });
      }
      
      // Check if report exists and user has access
      const existingReport = await db.collection('customReports').findOne({
        _id: new ObjectId(id),
        createdBy: user.email // Only allow updating own reports
      });
      
      if (!existingReport) {
        return NextResponse.json({ error: 'Report not found or not authorized to update' }, { status: 404 });
      }
      
      // Update the report
      const updateData = {
        name: data.name.trim(),
        description: data.description || '',
        fields: data.fields,
        filters: data.filters || [],
        sortBy: data.sortBy,
        updatedAt: new Date(),
        isPublic: !!data.isPublic
      };
      
      const result = await db.collection('customReports').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Report updated successfully',
        report: { ...existingReport, ...updateData }
      });
      
    } catch (error) {
      console.error('Error updating custom report:', error);
      return NextResponse.json(
        { error: 'Failed to update custom report' },
        { status: 500 }
      );
    }
  });
}

// DELETE: Delete a custom report
export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  return withAuth(request, async (user) => {
    try {
      const { db } = await connectToDatabase();
      
      // Check if report exists and user has access
      const existingReport = await db.collection('customReports').findOne({
        _id: new ObjectId(id),
        createdBy: user.email // Only allow deleting own reports
      });
      
      if (!existingReport) {
        return NextResponse.json({ error: 'Report not found or not authorized to delete' }, { status: 404 });
      }
      
      // Delete the report
      const result = await db.collection('customReports').deleteOne({
        _id: new ObjectId(id)
      });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Report deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting custom report:', error);
      return NextResponse.json(
        { error: 'Failed to delete custom report' },
        { status: 500 }
      );
    }
  });
} 