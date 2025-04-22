import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// Define the report template schema if not already defined
let ReportTemplate;

try {
  // Try to get the model if it already exists
  ReportTemplate = mongoose.model('ReportTemplate');
} catch (e) {
  // Define the model if it doesn't exist
  const ReportTemplateSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Report name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
    },
    fields: [{
      id: String,
      name: String,
      type: String,
      source: String,
      included: Boolean,
      displayName: String,
    }],
    filters: [{
      id: String,
      field: String,
      operator: String,
      value: String,
    }],
    sortBy: String,
    sortDirection: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  });

  ReportTemplate = mongoose.model('ReportTemplate', ReportTemplateSchema);
}

// GET - Retrieve custom report templates
export async function GET(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      await connectToDatabase();
      
      // Get current user and validate permissions
      const user = await User.findById(authUser.userId);
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      
      // Only SUPER_ADMIN and MANAGER can access reports
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
        return NextResponse.json({ 
          success: false, 
          message: 'Unauthorized. Only managers and admins can access report templates' 
        }, { status: 403 });
      }
      
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const templateId = searchParams.get('id');
      
      if (templateId) {
        // Get a specific template
        const template = await ReportTemplate.findOne({
          _id: templateId,
          createdBy: user._id
        });
        
        if (!template) {
          return NextResponse.json({ 
            success: false, 
            message: 'Template not found' 
          }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          template
        });
      } else {
        // Get all templates for the user
        const templates = await ReportTemplate.find({
          createdBy: user._id
        }).sort({ lastModified: -1 });
        
        return NextResponse.json({
          success: true,
          templates
        });
      }
    } catch (error) {
      console.error('Error retrieving report templates:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve report templates' },
        { status: 500 }
      );
    }
  });
}

// POST - Save a custom report template
export async function POST(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      await connectToDatabase();
      
      // Get current user and validate permissions
      const user = await User.findById(authUser.userId);
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      
      // Only SUPER_ADMIN and MANAGER can save report templates
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
        return NextResponse.json({ 
          success: false, 
          message: 'Unauthorized. Only managers and admins can save report templates' 
        }, { status: 403 });
      }
      
      // Get request body
      const templateData = await request.json();
      
      // Validate required fields
      if (!templateData.name) {
        return NextResponse.json({
          success: false,
          message: 'Report name is required'
        }, { status: 400 });
      }
      
      // Create or update the template
      let template;
      
      if (templateData._id) {
        // Update existing template
        template = await ReportTemplate.findOneAndUpdate(
          { _id: templateData._id, createdBy: user._id },
          {
            ...templateData,
            lastModified: new Date()
          },
          { new: true }
        );
        
        if (!template) {
          return NextResponse.json({
            success: false,
            message: 'Template not found or you do not have permission to update it'
          }, { status: 404 });
        }
      } else {
        // Create new template
        template = new ReportTemplate({
          ...templateData,
          createdBy: user._id,
          createdAt: new Date(),
          lastModified: new Date()
        });
        
        await template.save();
      }
      
      return NextResponse.json({
        success: true,
        message: 'Report template saved successfully',
        template
      });
    } catch (error) {
      console.error('Error saving report template:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to save report template' },
        { status: 500 }
      );
    }
  });
}

// DELETE - Delete a custom report template
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      await connectToDatabase();
      
      // Get current user and validate permissions
      const user = await User.findById(authUser.userId);
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      
      // Only SUPER_ADMIN and MANAGER can delete report templates
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
        return NextResponse.json({ 
          success: false, 
          message: 'Unauthorized. Only managers and admins can delete report templates' 
        }, { status: 403 });
      }
      
      // Get template ID from request body
      const { templateId } = await request.json();
      
      if (!templateId) {
        return NextResponse.json({
          success: false,
          message: 'Template ID is required'
        }, { status: 400 });
      }
      
      // Delete the template
      const result = await ReportTemplate.deleteOne({
        _id: templateId,
        createdBy: user._id
      });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({
          success: false,
          message: 'Template not found or you do not have permission to delete it'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Report template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting report template:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete report template' },
        { status: 500 }
      );
    }
  });
} 