import React from 'react';
import QuickLinksManager from '@/components/quicklinks/QuickLinksManager';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AccessDenied from '@/components/common/AccessDenied';

export default async function QuickLinksPage() {
  // Get token from cookies (async in Next.js 15)
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    redirect('/login');
  }
  
  // Verify token
  const user = verifyToken(token);
  
  if (!user) {
    redirect('/login');
  }
  
  // Only allow managers and super admins to access this page
  if (user.role !== 'MANAGER' && user.role !== 'SUPER_ADMIN') {
    return <AccessDenied message="You need manager privileges to access the Quick Links manager." />;
  }
  
  return (
    <div className="quick-links-container">
      <h1>Quick Links Manager</h1>
      <p className="description">
        Create and manage quick links for your team members.
      </p>
      <QuickLinksManager />
    </div>
  );
} 