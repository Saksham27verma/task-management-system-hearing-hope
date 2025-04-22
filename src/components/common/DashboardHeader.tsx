import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * A reusable header component for dashboard pages
 */
export default function DashboardHeader({ title, subtitle, action }: DashboardHeaderProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="medium">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Box>
            {action}
          </Box>
        )}
      </Box>
      <Divider sx={{ mt: 2, mb: 3 }} />
    </Box>
  );
} 