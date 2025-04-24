import jwt, { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import { IUser } from '../models/User';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Permission } from '@/types/permissions';
import { hasPermission, hasAnyPermission, hasAllPermissions } from './permissions';

// Environment variables for JWT
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '7d'; // Token expires in 7 days

// Extend the JwtPayload type to include our user fields
export interface JwtPayload extends BaseJwtPayload {
  userId: string;
  role: string;
  email: string;
}

// Create a JWT token for a user
export function createToken(user: IUser): string {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Error creating JWT token:', error);
    throw new Error('Failed to create authentication token');
  }
}

// Verify a JWT token
export function verifyToken(token: string): JwtPayload | null {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('Token is expired');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return null;
  }
}

// Get authenticated user from request
export async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  // Get token from authorization header or cookie
  let token: string | undefined;

  // Try to get from authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // If not in header, try to get from cookies
  if (!token) {
    // Get token from cookies directly via request object
    token = request.cookies.get('auth_token')?.value;
  }

  if (!token) return null;

  return verifyToken(token);
}

// Check if user has required role
export function hasRole(user: JwtPayload, ...roles: string[]): boolean {
  return roles.includes(user.role);
}

// Authentication middleware for API routes with role-based access control
export async function withAuth(
  request: NextRequest,
  callback: (user: JwtPayload) => Promise<NextResponse>,
  ...allowedRoles: string[]
): Promise<NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  if (allowedRoles.length > 0 && !hasRole(user, ...allowedRoles)) {
    return NextResponse.json(
      { success: false, message: 'Not authorized' },
      { status: 403 }
    );
  }

  return callback(user);
}

// New middleware for permission-based access control
export async function withPermission(
  request: NextRequest,
  callback: (user: JwtPayload) => Promise<NextResponse>,
  requiredPermission: Permission
): Promise<NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if the user has the required permission
  const hasAccess = await hasPermission(user, requiredPermission);
  if (!hasAccess) {
    return NextResponse.json(
      { success: false, message: 'Not authorized for this action' },
      { status: 403 }
    );
  }

  return callback(user);
}

// Middleware for checking any of the provided permissions
export async function withAnyPermission(
  request: NextRequest,
  callback: (user: JwtPayload) => Promise<NextResponse>,
  permissions: Permission[]
): Promise<NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if the user has any of the required permissions
  const hasAccess = await hasAnyPermission(user, permissions);
  if (!hasAccess) {
    return NextResponse.json(
      { success: false, message: 'Not authorized for this action' },
      { status: 403 }
    );
  }

  return callback(user);
}

// Middleware for checking all of the provided permissions
export async function withAllPermissions(
  request: NextRequest,
  callback: (user: JwtPayload) => Promise<NextResponse>,
  permissions: Permission[]
): Promise<NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if the user has all of the required permissions
  const hasAccess = await hasAllPermissions(user, permissions);
  if (!hasAccess) {
    return NextResponse.json(
      { success: false, message: 'Not authorized for this action' },
      { status: 403 }
    );
  }

  return callback(user);
} 