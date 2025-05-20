import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/User';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { userService } from '@/services/userService';

// Context type
interface UserContextType {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  getUserById: (id: string) => Promise<User | undefined>;
  getUsersByRole: (role: UserRole) => User[];
  addUser: (user: Omit<User, 'updatedAt'>) => void;
}

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  // Fetch users on mount
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch real users from API via the service - no fallbacks
      const fetchedUsers = await userService.getAllUsers();
      
      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
        console.log(`Loaded ${fetchedUsers.length} users from API`);
      } else {
        throw new Error("No users returned from API");
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
      // No fallback users - only real data from API
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Get a user by ID
  const getUserById = useCallback(async (id: string): Promise<User | undefined> => {
    // First check the local state
    const localUser = users.find(user => user.id === id);
    if (localUser) return localUser;
    
    // If not found locally, try to fetch from API
    try {
      const user = await userService.getUserById(id);
      return user || undefined;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return undefined;
    }
  }, [users]);

  // Get users by role
  const getUsersByRole = useCallback((role: UserRole): User[] => {
    return users.filter(user => user.role === role);
  }, [users]);

  // Add a new user (for testing purposes)
  const addUser = useCallback((user: Omit<User, 'updatedAt'>) => {
    // Add an updatedAt field
    const completeUser: User = {
      ...user,
      updatedAt: new Date()
    };
    
    // Add to the users array
    setUsers(prevUsers => {
      // Check if user with same ID already exists
      const exists = prevUsers.some(u => u.id === completeUser.id);
      if (exists) return prevUsers;
      
      // Add the new user
      return [...prevUsers, completeUser];
    });
  }, []);

  // Value object
  const value = {
    users,
    isLoading,
    error,
    fetchUsers,
    getUserById,
    getUsersByRole,
    addUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook
export const useUsers = () => {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  
  return context;
}; 