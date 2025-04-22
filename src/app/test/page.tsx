'use client';

import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';

export default function TestPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Test Page
        </Typography>
        <Typography variant="body1" paragraph>
          This is a simple test page to verify that basic rendering works.
        </Typography>
        <Button variant="contained" color="primary">
          Test Button
        </Button>
      </Box>
    </Container>
  );
} 