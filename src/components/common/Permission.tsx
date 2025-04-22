'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionProps {
  permission?: string;
  permissions?: string[];
  roles?: string[]; // Add support for role-based checking as fallback
  require?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Permission component that conditionally renders its children based on the user's permissions or roles.
 * @param permission - A single permission to check (if only one is needed)
 * @param permissions - An array of permissions to check
 * @param roles - An array of roles to check as fallback (if permissions check fails)
 * @param require - Whether to require any or all of the permissions (defaults to 'any')
 * @param fallback - Optional content to render if user doesn't have permission
 * @param children - Content to render if user has permission
 */
export default function Permission({
  permission,
  permissions,
  roles,
  require = 'any',
  fallback = null,
  children
}: PermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { user } = useAuth();
  
  // Single permission check
  if (permission) {
    // If permission check passes, render children
    if (hasPermission(permission)) {
      return <>{children}</>;
    }
    
    // If we have roles as fallback and the user has one of those roles, render children
    if (roles && user?.role && roles.includes(user.role)) {
      return <>{children}</>;
    }
    
    // Otherwise render fallback
    return <>{fallback}</>;
  }
  
  // Multiple permission check
  if (permissions && permissions.length > 0) {
    let hasAccess = false;
    
    if (require === 'all') {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
    
    // If permission check passes, render children
    if (hasAccess) {
      return <>{children}</>;
    }
    
    // Try role-based fallback
    if (roles && user?.role && roles.includes(user.role)) {
      return <>{children}</>;
    }
    
    // Otherwise render fallback
    return <>{fallback}</>;
  }
  
  // Role-only check (no permissions specified)
  if (roles && user?.role) {
    if (roles.includes(user.role)) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }
  
  // No permission or role requirements specified, render children by default
  return <>{children}</>;
} 