'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Button, Paper, Alert, CircularProgress } from '@mui/material';

export default function TestPage() {
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [googleConfig, setGoogleConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkServerHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/server-health');
      const data = await response.json();
      setServerHealth(data);
    } catch (err) {
      console.error('Error checking server health:', err);
      setError('Failed to check server health');
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/google/check');
      const data = await response.json();
      setGoogleConfig(data);
    } catch (err) {
      console.error('Error checking Google config:', err);
      setError('Failed to check Google configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>System Test Page</Typography>
        <Typography color="textSecondary" paragraph>
          Use this page to test critical system functionality.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={checkServerHealth}
              disabled={loading}
            >
              Check Server Health
            </Button>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={checkGoogleConfig}
              disabled={loading}
            >
              Check Google Config
            </Button>
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {serverHealth && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Server Health</Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(serverHealth, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}

        {googleConfig && (
          <Box>
            <Typography variant="h6" gutterBottom>Google Configuration</Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(googleConfig, null, 2)}
              </pre>
            </Paper>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button variant="outlined" href="/dashboard" sx={{ mx: 1 }}>
          Go to Dashboard
        </Button>
        <Button variant="outlined" href="/login" sx={{ mx: 1 }}>
          Go to Login
        </Button>
      </Box>
    </Container>
  );
} 