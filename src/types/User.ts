export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  position?: string;
  createdAt: Date;
  updatedAt: Date;
} 