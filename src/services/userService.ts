import { User } from '@/types/User';

// Interface for API response
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  users?: T[];
  user?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Extended user type for API responses
interface ApiUser {
  _id?: string;
  id?: string;
  username?: string;
  email: string;
  name: string;
  role: any; // Using any to avoid type conflicts between API and local types
  position?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Service for user-related API operations
 */
export const userService = {
  /**
   * Fetch all users from the API
   * @returns Promise resolving to an array of users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      // Real API call - no more hardcoded data
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }

      const data: ApiResponse<ApiUser> = await response.json();
      
      if (!data.success || !data.users) {
        throw new Error(data.message || 'No users returned from API');
      }
      
      // Transform the data to match our User type
      return data.users.map(user => ({
        id: (user._id || user.id || '').toString(),
        username: user.username || user.email.split('@')[0],
        email: user.email,
        name: user.name,
        role: user.role,
        position: user.position,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      })) as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },

  /**
   * Fetch a single user by ID
   * @param id User ID to fetch
   * @returns Promise resolving to a user object
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data: ApiResponse<ApiUser> = await response.json();
      
      if (!data.success || !data.user) {
        return null;
      }
      
      const user = data.user;
      
      return {
        id: (user._id || user.id || '').toString(),
        username: user.username || user.email.split('@')[0],
        email: user.email,
        name: user.name,
        role: user.role,
        position: user.position,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      } as User;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Search users by name, email, or position
   * @param query Search query
   * @returns Promise resolving to array of matching users
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data: ApiResponse<ApiUser> = await response.json();
      
      if (!data.success || !data.users) {
        return [];
      }
      
      return data.users.map(user => ({
        id: (user._id || user.id || '').toString(),
        username: user.username || user.email.split('@')[0],
        email: user.email,
        name: user.name,
        role: user.role,
        position: user.position,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      })) as User[];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}; 