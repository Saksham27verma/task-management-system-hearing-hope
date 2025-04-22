import { ROLE_PERMISSIONS } from '@/types/permissions';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

/**
 * Ensures that users have the correct permissions based on their roles.
 * This should be called during system initialization or after significant permission changes.
 */
export async function bootstrapPermissions() {
  try {
    console.log('Starting permission bootstrap process...');
    await connectToDatabase();
    
    // Process users by role
    const roles = ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'];
    
    for (const role of roles) {
      const rolePermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
      console.log(`Bootstrapping ${role} permissions: ${rolePermissions.length} permissions`);
      
      // Find all users with this role
      const users = await User.find({ role });
      console.log(`Found ${users.length} users with role ${role}`);
      
      // Update each user's custom permissions
      for (const user of users) {
        // Only add permissions that aren't already in the user's custom permissions
        const existingPermissions = new Set(user.customPermissions || []);
        const newPermissions = rolePermissions.filter(p => !existingPermissions.has(p));
        
        if (newPermissions.length > 0) {
          // Add new permissions without removing existing ones
          user.customPermissions = [...(user.customPermissions || []), ...newPermissions];
          await user.save();
          console.log(`Updated permissions for user ${user.name} (${user._id}): added ${newPermissions.length} permissions`);
        } else {
          console.log(`No new permissions needed for user ${user.name} (${user._id})`);
        }
      }
    }
    
    console.log('Permission bootstrap complete!');
    return { success: true, message: 'Permission bootstrap completed' };
  } catch (error) {
    console.error('Error bootstrapping permissions:', error);
    return { success: false, message: 'Error bootstrapping permissions' };
  }
}

/**
 * Ensures a specific user has the permissions needed to access the system
 * @param userId The ID of the user to bootstrap permissions for
 */
export async function bootstrapUserPermissions(userId: string) {
  try {
    console.log(`Bootstrapping permissions for user ${userId}`);
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User ${userId} not found`);
      return { success: false, message: 'User not found' };
    }
    
    // Get permissions for the user's role
    const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
    
    // Only add permissions that aren't already in the user's custom permissions
    const existingPermissions = new Set(user.customPermissions || []);
    const newPermissions = rolePermissions.filter(p => !existingPermissions.has(p));
    
    if (newPermissions.length > 0) {
      // Add new permissions without removing existing ones
      user.customPermissions = [...(user.customPermissions || []), ...newPermissions];
      await user.save();
      console.log(`Updated permissions for user ${user.name} (${user._id}): added ${newPermissions.length} permissions`);
    } else {
      console.log(`No new permissions needed for user ${user.name} (${user._id})`);
    }
    
    return { 
      success: true, 
      message: 'User permissions updated', 
      permissions: user.customPermissions
    };
  } catch (error) {
    console.error(`Error bootstrapping permissions for user ${userId}:`, error);
    return { success: false, message: 'Error bootstrapping user permissions' };
  }
} 