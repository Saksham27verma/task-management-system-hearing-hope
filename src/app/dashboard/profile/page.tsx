'use client';

import React from 'react';
import { Container, Typography, Paper, Box, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  
  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ p: 4, mt: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1">
            User Profile
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'secondary.main',
              fontSize: '2rem',
              mr: 3
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          
          <Box>
            <Typography variant="h5">{user?.name || 'User'}</Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.position || 'Position not available'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'Email not available'}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" paragraph>
          This page is under development. The profile management feature will be implemented in a future update.
        </Typography>
        
        <Typography variant="body1">
          The profile page will allow you to:
        </Typography>
        
        <ul>
          <li>Update your personal information</li>
          <li>Change your password</li>
          <li>Manage notification preferences</li>
          <li>View your activity history</li>
        </ul>
      </Paper>
    </Container>
  );
} 