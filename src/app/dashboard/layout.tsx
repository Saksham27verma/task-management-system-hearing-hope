'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If authentication is done loading and user is not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 3,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // If not authenticated and not loading, don't render anything (will redirect)
  if (!isAuthenticated && !isLoading) {
    return null;
  }

  // Render the dashboard with the children
  return (
    <>
      {/* Emergency Permissions Fix Script - for debugging purposes only */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.fixPermissions = async (userId) => {
            try {
              const url = userId 
                ? '/api/system/fix-permissions?userId=' + userId
                : '/api/system/fix-permissions';
              
              const response = await fetch(url);
              const data = await response.json();
              
              if (data.success) {
                console.log('✅ Permissions fixed:', data.message);
                alert('Permissions fixed successfully! Refreshing page...');
                window.location.reload();
                return data;
              } else {
                console.error('❌ Permission fix failed:', data.message);
                alert('Permission fix failed: ' + data.message);
                return data;
              }
            } catch (error) {
              console.error('❌ Error fixing permissions:', error);
              alert('Error fixing permissions. Check console for details.');
              return { success: false, error };
            }
          };
          
          console.log('💡 Permissions helper available. To fix permissions issues, run: fixPermissions()');
        `
      }} />
      
      <DashboardLayout>{children}</DashboardLayout>
    </>
  );
} 