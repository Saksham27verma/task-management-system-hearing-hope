import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container maxWidth="md">
      <Box textAlign="center" mt={10}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Page not found
        </Typography>
        <Typography variant="body1" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button
          component={Link}
          href="/dashboard"
          variant="contained"
          color="primary"
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
} 