'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  LinearProgress,
  Alert,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const { login, isLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fade-in animation on mount
  useEffect(() => {
    setFadeIn(true);
  }, []);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      return false;
    }

    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }

    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      const success = await login(email, password);
      if (!success) {
        setErrorMessage('Invalid email or password');
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #E3F2FD 100%)',
        py: 4,
      }}
    >
      {isLoading && (
        <LoadingScreen 
          message="Logging in..." 
          fullScreen={true}
          showProgress={true}
          showAppName={false}
          logoSize={{ width: 200, height: 70 }}
        />
      )}
      
      <Container component="main" maxWidth="sm">
        <Fade in={fadeIn} timeout={800}>
          <Paper 
            elevation={6} 
            sx={{ 
              padding: { xs: 3, sm: 4 }, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              width: '100%',
              borderRadius: 2,
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {isLoading && (
              <LinearProgress 
                sx={{ 
                  width: '100%', 
                  position: 'absolute', 
                  top: 0, 
                  left: 0,
                  height: '4px',
                }} 
              />
            )}
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3, 
              mt: 2,
              transform: isMobile ? 'scale(0.9)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }}>
              <Image 
                src="/images/logohope.svg" 
                alt="Hearing Hope Logo" 
                width={isMobile ? 150 : 180} 
                height={isMobile ? 60 : 70} 
                style={{ 
                  objectFit: 'contain',
                  transition: 'all 0.3s ease', 
                }} 
                priority
              />
            </Box>
            
            <Typography 
              component="h1" 
              variant={isMobile ? "h5" : "h4"} 
              sx={{ 
                mb: 3, 
                color: 'primary.main', 
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              Task Management System
            </Typography>
            
            {errorMessage && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 2,
                  borderRadius: 1,
                  '& .MuiAlert-icon': {
                    color: 'error.main'
                  }
                }}
              >
                {errorMessage}
              </Alert>
            )}
            
            <Box 
              component="form" 
              onSubmit={handleSubmit} 
              sx={{ 
                width: '100%',
                mt: 1, 
              }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!emailError}
                helperText={emailError}
                disabled={isLoading}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  mb: 2,
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  mb: 2,
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 2, 
                  mb: 3, 
                  py: 1.5,
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(238, 100, 23, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 6px 15px rgba(238, 100, 23, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    opacity: 0.8,
                    fontSize: '0.9rem'
                  }}
                >
                  Contact your administrator if you have trouble logging in
                </Typography>
              </Box>
            </Box>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 5,
                opacity: 0.7,
                fontSize: '0.8rem'
              }}
            >
              &copy; {new Date().getFullYear()} Hearing Hope. All rights reserved.
            </Typography>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
} 