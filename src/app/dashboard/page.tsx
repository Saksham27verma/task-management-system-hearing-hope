'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // Only redirect after authentication is checked and user is loaded
    if (!isLoading && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'SUPER_ADMIN':
          router.push('/dashboard/admin');
          break;
        case 'MANAGER':
          router.push('/dashboard/manager');
          break;
        case 'EMPLOYEE':
          router.push('/dashboard/employee');
          break;
        default:
          // Default to tasks page if role can't be determined
          router.push('/dashboard/tasks');
      }
    }
  }, [user, isLoading, router]);
  
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
        Redirecting to your dashboard...
      </Typography>
    </Box>
  );
} 