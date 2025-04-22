import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/models/User';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser({
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          position: data.user.position,
        });

        // Fetch permissions for the logged-in user
        try {
          const permissionsResponse = await fetch(`/api/users/${data.user._id}/permissions`);
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            if (permissionsData.success) {
              setUser(prev => ({
                ...prev!,
                permissions: permissionsData.permissions
              }));
            }
          }
        } catch (permError) {
          console.error('Error fetching user permissions:', permError);
          // Continue even if permissions fetch fails
        }

        setError(null);
        setIsAuthenticated(true);
        
        // Redirect to the main dashboard instead of role-specific pages
        router.push('/dashboard');
        
        return true;
      } else {
        setError(data.message || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('User refresh failed:', error);
    }
  };

  // Add hasPermission method implementation
  // Method to check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) {
      console.log(`Permission check failed for "${permission}": No user or permissions found`);
      return false;
    }
    const result = user.permissions.includes(permission);
    console.log(`Permission check for "${permission}": ${result ? 'GRANTED' : 'DENIED'}`);
    return result;
  };

  // Method to check if user has any of the given permissions
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user || !user.permissions) {
      console.log(`Any permission check failed for [${permissions.join(', ')}]: No user or permissions found`);
      return false;
    }
    const result = permissions.some(permission => user.permissions!.includes(permission));
    console.log(`Any permission check for [${permissions.join(', ')}]: ${result ? 'GRANTED' : 'DENIED'}`);
    return result;
  };

  // Method to check if user has all of the given permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user || !user.permissions) {
      console.log(`All permissions check failed for [${permissions.join(', ')}]: No user or permissions found`);
      return false;
    }
    const result = permissions.every(permission => user.permissions!.includes(permission));
    console.log(`All permissions check for [${permissions.join(', ')}]: ${result ? 'GRANTED' : 'DENIED'}`);
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 