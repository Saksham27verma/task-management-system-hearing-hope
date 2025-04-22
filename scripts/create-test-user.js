/**
 * Create Test User script
 * Creates a test user with known credentials for login testing
 * 
 * Usage: 
 * - Make sure your .env.local file is set up
 * - Run with: node scripts/create-test-user.js
 */

console.log('Starting create test user script...');
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Define User schema (simplified version of the actual schema)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  position: String,
  isActive: Boolean,
  lastLogin: Date,
}, { timestamps: true });

// Create a test user
const createTestUser = async () => {
  console.log('Attempting to create test user...');
  try {
    // Check if User model exists in mongoose models
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Check if test user already exists
    const testEmail = 'test@example.com';
    const existingUser = await User.findOne({ email: testEmail });
    
    if (existingUser) {
      console.log('⚠️ Test user already exists, updating password...');
      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      await User.updateOne(
        { email: testEmail },
        { 
          password: hashedPassword,
          isActive: true 
        }
      );
      
      console.log('✅ Test user password updated');
      return;
    }
    
    // Create new test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const testUser = new User({
      name: 'Test User',
      email: testEmail,
      password: hashedPassword,
      role: 'SUPER_ADMIN', // Give admin role for full access
      phone: '1234567890',
      position: 'Test Position',
      isActive: true,
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('Test user credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
};

// Run the script
const run = async () => {
  console.log('Running script...');
  const connected = await connectToDatabase();
  
  if (connected) {
    await createTestUser();
    console.log('✅ Script completed');
  } else {
    console.error('❌ Could not connect to database, script failed');
  }
  
  // Close database connection
  console.log('Closing database connection...');
  mongoose.connection.close();
};

// Execute the script
run().catch(err => {
  console.error('Unhandled error in script:', err);
  process.exit(1);
}); 