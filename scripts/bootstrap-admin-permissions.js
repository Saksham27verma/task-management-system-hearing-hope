/**
 * Bootstrap Admin Permissions script
 * Ensures that the super admin user has all required permissions
 * 
 * Usage: 
 * - Make sure your .env.local file is set up
 * - Run with: node scripts/bootstrap-admin-permissions.js
 */

console.log('Starting bootstrap admin permissions script...');
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

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

// Define the permissions for super admin
const SUPER_ADMIN_PERMISSIONS = [
  // Task permissions
  'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete', 'tasks:assign', 'tasks:complete', 
  // User permissions
  'users:create', 'users:read', 'users:update', 'users:delete',
  // Report permissions
  'reports:read', 'reports:create', 'reports:export',
  // Notice permissions
  'notices:create', 'notices:read', 'notices:update', 'notices:delete',
  // Message permissions
  'messages:create', 'messages:read', 'messages:delete',
  // Company permissions
  'company:read', 'company:update',
  // Calendar permissions
  'calendar:read', 'calendar:update',
  // Settings permissions
  'settings:read', 'settings:update'
];

// Bootstrap super admin permissions
const bootstrapAdminPermissions = async () => {
  console.log('Attempting to bootstrap super admin permissions...');
  try {
    // Find all super admins
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      customPermissions: [String],
    }));
    
    const superAdmins = await User.find({ role: 'SUPER_ADMIN' });
    console.log(`Found ${superAdmins.length} super admin users.`);
    
    if (superAdmins.length === 0) {
      console.log('❌ No super admin users found. Please run the seed script first.');
      return;
    }
    
    // Update each super admin's permissions
    for (const admin of superAdmins) {
      console.log(`Updating permissions for admin: ${admin.name} (${admin.email})`);
      
      // Force replace permissions to ensure all are included
      admin.customPermissions = [...SUPER_ADMIN_PERMISSIONS];
      await admin.save();
      
      console.log(`✅ Updated permissions for ${admin.name}. Total permissions: ${admin.customPermissions.length}`);
      console.log('Permissions:', admin.customPermissions);
    }
    
    console.log('✅ Super admin permissions bootstrap completed');
  } catch (error) {
    console.error('❌ Error bootstrapping super admin permissions:', error);
  }
};

// Run the script
const run = async () => {
  console.log('Running script...');
  const connected = await connectToDatabase();
  
  if (connected) {
    await bootstrapAdminPermissions();
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