import { ROLE_PERMISSIONS } from '@/types/permissions';
import { Permission } from '@/types/permissions';
import { JwtPayload } from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Check if a user has a specific permission by combining role-based and custom permissions
 * @param userId The user ID to check permissions for
 * @param requiredPermission The permission string to check (e.g., 'tasks:create')
 * @returns Promise<boolean> Whether the user has the permission
 */
export async function checkPermission(
  userId: string, 
  requiredPermission: Permission
): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();
    
    // Get the user
    const userObjectId = new ObjectId(userId);
    const user = await db.collection('users').findOne({ _id: userObjectId });
    
    if (!user) {
      console.error(`Permission check failed: User ${userId} not found`);
      return false;
    }
    
    // Start with the role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
    console.log(`User ${userId} with role ${user.role} has role permissions:`, rolePermissions);

    // Add any custom permissions assigned directly to the user
    const customPermissions = user.customPermissions || [];
    console.log(`User ${userId} has custom permissions:`, customPermissions);

    // Check if the required permission is in role permissions or custom permissions
    if ((rolePermissions as readonly string[]).includes(requiredPermission) || customPermissions.includes(requiredPermission)) {
      console.log(`Permission check for ${requiredPermission}: GRANTED`);
      return true;
    }

    // Only try to check permission groups if we have any
    const groupPermissions: string[] = [];
    if (user.permissionGroups && user.permissionGroups.length > 0) {
      try {
        // Get permission groups
        const groupIds = user.permissionGroups.map((id: any) => 
          typeof id === 'string' ? new ObjectId(id) : id
        );
        
        const permissionGroups = await db.collection('permissionGroups')
          .find({ _id: { $in: groupIds } })
          .toArray();
        
        // Flatten permissions from all groups
        for (const group of permissionGroups) {
          if (group.permissions) {
            groupPermissions.push(...group.permissions);
          }
        }
      } catch (groupError) {
        console.error('Error checking permission groups, skipping:', groupError);
        // Continue without group permissions if there's an error
      }
    }
    console.log(`User ${userId} has group permissions:`, groupPermissions);

    // Check if required permission is in group permissions
    if (groupPermissions.includes(requiredPermission)) {
      console.log(`Permission check for ${requiredPermission}: GRANTED by group`);
      return true;
    }

    // Permission not found in any of the sources
    console.log(`Permission check for ${requiredPermission}: DENIED`);
    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    // For dashboard access, default to allowing access on error
    return requiredPermission === 'reports:read';
  }
}

/**
 * Get all permissions for a user by combining role and custom permissions
 * @param userId The user ID
 * @returns Promise<string[]> Array of permission strings
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const { db } = await connectToDatabase();
    
    // Get the user
    const userObjectId = new ObjectId(userId);
    const user = await db.collection('users').findOne({ _id: userObjectId });
    
    if (!user) return [];

    // Start with the role-based permissions
    const rolePermissionSet = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
    // Convert readonly array to mutable array
    const rolePermissions = [...rolePermissionSet];

    // Add any custom permissions assigned directly to the user
    const customPermissions = user.customPermissions || [];

    // Add permissions from any permission groups assigned to the user
    const groupPermissions: string[] = [];
    if (user.permissionGroups && user.permissionGroups.length > 0) {
      try {
        // Get permission groups
        const groupIds = user.permissionGroups.map((id: any) => 
          typeof id === 'string' ? new ObjectId(id) : id
        );
        
        const permissionGroups = await db.collection('permissionGroups')
          .find({ _id: { $in: groupIds } })
          .toArray();
        
        // Flatten permissions from all groups
        for (const group of permissionGroups) {
          if (group.permissions) {
            groupPermissions.push(...group.permissions);
          }
        }
      } catch (groupError) {
        console.error('Error getting group permissions, skipping:', groupError);
        // Continue without group permissions if there's an error
      }
    }

    // Combine and deduplicate all permissions
    return [...new Set([...rolePermissions, ...customPermissions, ...groupPermissions])];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    // Return just the role-based permissions if there's an error
    try {
      const { db } = await connectToDatabase();
      const userObjectId = new ObjectId(userId);
      const user = await db.collection('users').findOne({ _id: userObjectId });
      
      if (user && user.role) {
        const rolePermSet = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
        return [...rolePermSet];
      }
    } catch (e) {
      console.error('Second error getting user permissions:', e);
    }
    return [];
  }
}

/**
 * Middleware-style function to check if the user from a JWT has the required permission
 * @param user JWT payload with user information
 * @param requiredPermission The required permission
 * @returns Promise<boolean> Whether the user has the permission
 */
export async function hasPermission(
  user: JwtPayload,
  requiredPermission: Permission
): Promise<boolean> {
  return checkPermission(user.userId, requiredPermission);
}

/**
 * Check multiple permissions at once (any match)
 * @param user JWT payload with user information
 * @param permissions Array of required permissions (any one is sufficient)
 * @returns Promise<boolean> Whether the user has any of the permissions
 */
export async function hasAnyPermission(
  user: JwtPayload,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(user, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check multiple permissions at once (all must match)
 * @param user JWT payload with user information
 * @param permissions Array of required permissions (all must be granted)
 * @returns Promise<boolean> Whether the user has all of the permissions
 */
export async function hasAllPermissions(
  user: JwtPayload,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(user, permission))) {
      return false;
    }
  }
  return true;
} 