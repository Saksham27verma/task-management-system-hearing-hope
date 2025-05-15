import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import Link from 'next/link';

const AccessDenied = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        width: '100%',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
          maxWidth: 500,
          width: '100%',
        }}
      >
        <LockIcon
          sx={{
            fontSize: 64,
            color: 'error.main',
            mb: 2,
          }}
        />
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          You don't have permission to access this page. This feature is only available for managers and administrators.
        </Typography>
        <Button
          component={Link}
          href="/dashboard"
          variant="contained"
          color="primary"
          sx={{ minWidth: 150 }}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default AccessDenied; 