/**
 * Rate Limiting Middleware for API Routes
 * 
 * This middleware implements a simple in-memory rate limiting solution
 * for API routes. For production, consider using a Redis-based solution
 * for distributed environments.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  limit: number;       // Maximum number of requests
  windowMs: number;    // Time window in milliseconds
}

// Store for tracking requests (in-memory for now, use Redis in large production environments)
const ipRequestStore: Map<string, { count: number; resetTime: number }> = new Map();

// Default rate limit configurations for different types of routes
const rateLimitConfigs = {
  default: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  auth: { limit: 10, windowMs: 60 * 1000 },    // 10 auth requests per minute
  sensitive: { limit: 20, windowMs: 60 * 1000 } // 20 requests per minute for sensitive operations
};

/**
 * Apply rate limiting middleware to a Next.js API route
 * 
 * @param request The Next.js request object
 * @param configType The type of rate limit to apply (default, auth, sensitive)
 * @returns NextResponse or null if rate limit not exceeded
 */
export function rateLimit(
  request: NextRequest,
  configType: keyof typeof rateLimitConfigs = 'default'
): NextResponse | null {
  // Get configuration based on type
  const config = rateLimitConfigs[configType];
  
  // Get client IP
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const now = Date.now();
  
  // Get existing record or create new one
  let record = ipRequestStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // Reset if expired
    record = { count: 0, resetTime: now + config.windowMs };
    ipRequestStore.set(ip, record);
  }
  
  // Increment count
  record.count += 1;
  
  // Check if over limit
  if (record.count > config.limit) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later' },
      { status: 429, headers: { 'Retry-After': `${Math.ceil(config.windowMs / 1000)}` } }
    );
  }
  
  // Not rate limited, continue to handler
  return null;
}

// Clean up expired entries (call this occasionally via a setTimeout in a global context)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [ip, record] of ipRequestStore.entries()) {
    if (now > record.resetTime) {
      ipRequestStore.delete(ip);
    }
  }
}

// Set up cleanup to run every 10 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(cleanupRateLimitStore, 10 * 60 * 1000);
} 