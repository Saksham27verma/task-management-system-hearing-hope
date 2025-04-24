/**
 * Seed script to create the initial Super Admin user
 * 
 * Usage: 
 * - Make sure your .env.local file is set up
 * - Run with: node scripts/seed.js
 */

console.log('Starting seed script...');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

// Connect to MongoDB
const connectToDatabase = async () => {
  console.log('Attempting to connect to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};

// Define User schema for seeding
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  position: String,
  isActive: Boolean,
  lastLogin: Date,
});

// Create Super Admin user
const createSuperAdmin = async () => {
  console.log('Attempting to create Super Admin...');
  try {
    // Check if User model exists in mongoose models
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Check if Super Admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@hearinghope.org' });
    
    if (existingAdmin) {
      console.log('⚠️ Super Admin already exists, skipping creation');
      return;
    }
    
    // Create a new Super Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const newAdmin = new User({
      name: 'Super Admin',
      email: 'admin@hearinghope.org',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      phone: '1234567890',
      position: 'Administrator',
      isActive: true,
    });
    
    await newAdmin.save();
    console.log('✅ Super Admin created successfully');
    
    // Add company information
    console.log('Attempting to create company information...');
    const companySchema = new mongoose.Schema({
      name: String,
      description: String,
      address: String,
      email: String,
      phone: String,
      website: String,
      logoUrl: String,
      socialLinks: Array,
    });
    
    const Company = mongoose.models.Company || mongoose.model('Company', companySchema);
    
    const existingCompany = await Company.findOne();
    
    if (!existingCompany) {
      const company = new Company({
        name: 'Hearing Hope',
        description: 'Providing hearing solutions and support to communities in need.',
        address: '123 Main Street, Suite 100, Anytown, CA 12345',
        email: 'info@hearinghope.org',
        phone: '(555) 123-4567',
        website: 'https://hearinghope.org',
        socialLinks: [
          { platform: 'Facebook', url: 'https://facebook.com/hearinghope' },
          { platform: 'Twitter', url: 'https://twitter.com/hearinghope' },
          { platform: 'Instagram', url: 'https://instagram.com/hearinghope' }
        ]
      });
      
      await company.save();
      console.log('✅ Company information created successfully');
    } else {
      console.log('⚠️ Company information already exists, skipping creation');
    }
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
  }
};

// Run the seed process
const seedDatabase = async () => {
  console.log('Beginning seed database process...');
  const connected = await connectToDatabase();
  
  if (connected) {
    try {
      // Remove any test/sample data accounts
      console.log('Removing any sample/test accounts...');
      const User = mongoose.models.User || mongoose.model('User', userSchema);
      
      // Delete sample users
      const mockEmails = [
        'admin@example.com',
        'manager@example.com',
        'employee1@example.com',
        'employee2@example.com',
        'employee3@example.com'
      ];
      
      const deleteResult = await User.deleteMany({ 
        email: { $in: mockEmails }
      });
      
      console.log(`✅ Removed ${deleteResult.deletedCount} sample/test accounts`);
      
      // Delete sample tasks with random titles
      console.log('Removing sample/test tasks...');
      const Task = mongoose.models.Task || mongoose.model('Task', {
        title: String,
        description: String
      });
      
      const taskDeleteResult = await Task.deleteMany({
        title: { $regex: /^Task \d+$/ } // Delete tasks with titles like "Task 123"
      });
      
      console.log(`✅ Removed ${taskDeleteResult.deletedCount} sample/test tasks`);
      
      // Now create the super admin account
      await createSuperAdmin();
      console.log('✅ Seed process completed');
    } catch (error) {
      console.error('❌ Error during seed process:', error);
    }
  } else {
    console.error('❌ Could not connect to database, seed process failed');
  }
  
  // Close database connection
  console.log('Closing database connection...');
  mongoose.connection.close();
};

// Execute the seed function
console.log('Executing seedDatabase function...');
seedDatabase().catch(err => {
  console.error('Unhandled error in seed script:', err);
  process.exit(1);
}); 