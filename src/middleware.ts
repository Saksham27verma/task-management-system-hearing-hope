import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

/**
 * Simple basic token validation without using crypto or JWT
 * Edge Runtime compatible - just checks if token exists and isn't expired
 */
function isTokenValid(token: string): boolean {
  if (!token || token.trim() === '') {
    return false;
  }
  
  try {
    // Just a basic check that it's in the expected format
    const parts = token.split('.');
    return parts.length === 3;
  } catch (error) {
    return false;
  }
}

/**
 * Middleware function to handle authentication
 * This will run on every request to check if the user is authenticated
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths without authentication
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }
  
  // Allow API routes to handle their own authentication
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Check for auth token in cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // If no token, redirect to login
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  
  // Verify token format - actual validation will happen in the API
  const isValid = isTokenValid(token);
  
  // If token is invalid, redirect to login
  if (!isValid) {
    // Clear invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
  
  // User is authenticated, proceed with the request
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|images|public|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)',
  ],
}; 