'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user permissions from the API
  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user || !user.id) {
      console.log('Cannot fetch permissions: No authenticated user or missing user ID');
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching permissions for user ID: ${user.id}`);
      
      // Validate user ID before making the API call
      if (user.id === 'undefined' || user.id === 'null') {
        console.error(`Invalid user ID detected: ${user.id}`);
        setError('Invalid user ID');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/users/${user.id}/permissions`);
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 500) {
          // If there's a permission error, try to fix it with the direct API
          console.warn('Permission error detected, trying emergency fix...');
          try {
            const fixResponse = await fetch(`/api/system/fix-permissions?userId=${user.id}`);
            if (fixResponse.ok) {
              console.log('Successfully applied emergency permission fix');
              // Try fetching permissions again after fix
              const retryResponse = await fetch(`/api/users/${user.id}/permissions`);
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.success) {
                  setPermissions(retryData.permissions || []);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (fixError) {
            console.error('Error applying emergency fix:', fixError);
          }
        }
        
        throw new Error(`Failed to fetch permissions: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setPermissions(data.permissions || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch permissions');
        // Set empty permissions array on error
        setPermissions([]);
      }
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
      setError(err.message || 'An error occurred');
      setPermissions([]); // Ensure permissions are emptied on error
      
      // As a fallback, assign default role-based permissions directly
      if (user && user.role) {
        try {
          // Dynamically import permissions
          const { ROLE_PERMISSIONS } = await import('@/types/permissions');
          // @ts-ignore - Necessary because of the type conflicts
          const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
          console.log('Using fallback role-based permissions:', rolePermissions);
          setPermissions(Array.from(rolePermissions));
        } catch (importError) {
          console.error('Error loading fallback permissions:', importError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load permissions on component mount or when user changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  }, [permissions]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission));
  }, [permissions]);

  // Reload permissions from the server
  const reloadPermissions = useCallback(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Fix permissions directly
  const fixPermissions = useCallback(async () => {
    if (!user || !user.id) {
      console.error('Cannot fix permissions: No user or missing user ID');
      return false;
    }
    
    try {
      const response = await fetch(`/api/system/fix-permissions?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Reload permissions after fix
          await fetchPermissions();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error fixing permissions:', error);
      return false;
    }
  }, [user, fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    reloadPermissions,
    fixPermissions
  };
} 