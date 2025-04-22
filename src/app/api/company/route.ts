import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Company from '@/models/Company';
import { withAuth, hasRole } from '@/lib/auth';

// GET /api/company - Get company information
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      await connectToDatabase();
      
      // Get company information (should be only one record)
      const company = await Company.findOne();
      
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Company information not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        company
      });
    } catch (error) {
      console.error('Error fetching company information:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch company information' },
        { status: 500 }
      );
    }
  });
}

// POST /api/company - Create or update company information
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    // Only super admin can update company information
    if (!hasRole(user, 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update company information' },
        { status: 403 }
      );
    }
    
    try {
      const {
        name,
        description,
        address,
        email,
        phone,
        website,
        logoUrl,
        socialLinks
      } = await request.json();
      
      // Validate required fields
      if (!name || !description || !address || !email || !phone || !website) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        );
      }
      
      // Connect to database
      await connectToDatabase();
      
      // Check if company information already exists
      let company = await Company.findOne();
      
      if (company) {
        // Update existing company information
        company.name = name;
        company.description = description;
        company.address = address;
        company.email = email;
        company.phone = phone;
        company.website = website;
        
        if (logoUrl !== undefined) {
          company.logoUrl = logoUrl;
        }
        
        if (socialLinks) {
          company.socialLinks = socialLinks;
        }
      } else {
        // Create new company information
        company = new Company({
          name,
          description,
          address,
          email,
          phone,
          website,
          logoUrl,
          socialLinks: socialLinks || []
        });
      }
      
      // Save company information
      await company.save();
      
      return NextResponse.json({
        success: true,
        message: 'Company information updated successfully',
        companyId: company._id
      });
    } catch (error) {
      console.error('Error updating company information:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update company information' },
        { status: 500 }
      );
    }
  });
} 