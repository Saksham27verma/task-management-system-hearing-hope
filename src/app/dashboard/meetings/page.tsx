'use client';

import React, { useRef } from 'react';
import { Container, Typography, Box, Paper, Button, Alert, Link } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import GoogleMeetIntegration from '@/components/meetings/GoogleMeetIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import DashboardHeader from '@/components/common/DashboardHeader';

export default function MeetingsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const integrationRef = useRef<HTMLButtonElement>(null);
  
  // Check if user can create meetings (managers and admins)
  const canCreateMeetings = 
    user?.role === 'SUPER_ADMIN' || 
    user?.role === 'MANAGER' ||
    hasPermission('calendar:update');

  return (
    <Container maxWidth="lg">
      <DashboardHeader
        title="Meetings"
        subtitle="Schedule and manage your virtual meetings"
        action={canCreateMeetings ? 
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              const button = document.querySelector('[data-create-meeting="true"]') as HTMLButtonElement;
              if (button) button.click();
            }}
          >
            New Meeting
          </Button> : undefined
        }
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        To use Google Meet integration, you'll need to sign in with your Google account. 
        Once signed in, you can create and join meetings directly from this interface.
      </Alert>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <GoogleMeetIntegration canCreateMeetings={canCreateMeetings} />
      </Paper>
    </Container>
  );
} 