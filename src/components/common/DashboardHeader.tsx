import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

// Define theme colors
const ORANGE_COLOR = '#F26722';

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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 6, 
              height: 36, 
              bgcolor: ORANGE_COLOR, 
              mr: 2, 
              borderRadius: 1,
              display: { xs: 'none', sm: 'block' }
            }} 
          />
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              fontWeight="medium"
              sx={{ 
                color: '#333',
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {subtitle}
              </Typography>
            )}
          </Box>
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