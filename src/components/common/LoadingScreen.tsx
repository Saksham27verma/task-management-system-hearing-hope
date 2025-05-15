'use client';

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Fade, keyframes, useTheme } from '@mui/material';
import Image from 'next/image';
import { useThemeMode } from '@/contexts/ThemeContext';

// Define theme colors
const ORANGE_COLOR = '#F26722';
const TEAL_COLOR = '#19ac8b';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  delay?: number;
  showProgress?: boolean;
  logoSize?: { width: number; height: number };
  showAppName?: boolean;
  animationStyle?: 'pulse' | 'bounce' | 'rotate' | 'shine' | 'fade';
  progressColor?: string;
  logoBackgroundEffect?: 'glow' | 'ripple' | 'none';
}

// Define keyframe animations
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
`;

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const shine = keyframes`
  0% { mask-position: 0% 0; }
  100% { mask-position: 200% 0; }
`;

const fadeInOut = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 30px rgba(242, 103, 34, 0.4); }
  50% { box-shadow: 0 0 50px rgba(242, 103, 34, 0.7); }
`;

const ripple = keyframes`
  0% { 
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  100% { 
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
`;

// Enhanced backdrop effect animation
const gradientMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Logo reveal animation
const revealLogo = keyframes`
  0% { 
    transform: translateY(20px);
    opacity: 0;
  }
  100% { 
    transform: translateY(0);
    opacity: 1;
  }
`;

// Text reveal animation with typing effect
const revealText = keyframes`
  0% { 
    width: 0;
    opacity: 0; 
  }
  100% { 
    width: 100%;
    opacity: 1; 
  }
`;

export default function LoadingScreen({ 
  message = 'Loading...', 
  fullScreen = true,
  delay = 300,
  showProgress = true,
  logoSize = { width: 200, height: 70 },
  showAppName = false,
  animationStyle = 'pulse',
  progressColor,
  logoBackgroundEffect = 'glow'
}: LoadingScreenProps) {
  const [show, setShow] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const theme = useTheme();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  
  // Handle delay to prevent flashing for quick loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [delay]);
  
  // Simulate loading progress
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (show && showProgress) {
      timer = setInterval(() => {
        setProgressValue((prevProgress) => {
          // Slow down progress as it gets closer to 100
          const increment = Math.max(1, 15 - Math.floor(prevProgress / 10));
          const nextProgress = Math.min(prevProgress + increment, 95);
          return nextProgress;
        });
      }, 400);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [show, showProgress]);
  
  // Get the appropriate animation based on selected style
  const getAnimation = () => {
    switch(animationStyle) {
      case 'pulse':
        return `${pulse} 2s infinite ease-in-out`;
      case 'bounce':
        return `${bounce} 2s infinite`;
      case 'rotate':
        return `${rotate} 8s infinite linear`;
      case 'shine':
        return 'none'; // Shine is handled separately with ::after
      case 'fade':
        return `${fadeInOut} 2s infinite ease-in-out`;
      default:
        return `${pulse} 2s infinite ease-in-out`;
    }
  };
  
  // Don't render anything until the delay has passed
  if (!show) {
    return null;
  }
  
  return (
    <Fade in={show} timeout={600}>
      <Box
        sx={{
          position: fullScreen ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backgroundColor: fullScreen 
            ? (isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)')
            : 'transparent',
          backdropFilter: fullScreen ? 'blur(8px)' : 'none',
          // Enhanced background effect
          ...(fullScreen && {
            background: isDark 
              ? `linear-gradient(135deg, 
                  rgba(10,10,15,0.95) 0%, 
                  rgba(20,20,30,0.95) 50%, 
                  rgba(10,10,15,0.95) 100%)`
              : `linear-gradient(135deg, 
                  rgba(255,255,255,0.95) 0%, 
                  rgba(245,245,250,0.95) 50%, 
                  rgba(255,255,255,0.95) 100%)`,
            backgroundSize: '400% 400%',
            animation: `${gradientMove} 15s ease infinite`,
          }),
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: `${revealLogo} 0.8s ease-out forwards`,
          }}
        >
          {/* Logo container with effects */}
          <Box
            sx={{
              display: 'flex',
              position: 'relative',
              mb: showAppName ? 3 : 4,
              
              ...(logoBackgroundEffect === 'glow' && {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  animation: `${glow} 3s infinite ease-in-out`,
                  zIndex: -1,
                }
              }),
              
              ...(logoBackgroundEffect === 'ripple' && {
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: `2px solid ${ORANGE_COLOR}`,
                  animation: `${ripple} 2s infinite`,
                  zIndex: -1,
                },
                '&::after': {
                  animationDelay: '0.5s',
                }
              }),
              
              // Shine effect for the logo
              ...(animationStyle === 'shine' && {
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.5),
                    transparent
                  )`,
                  backgroundSize: '200% 100%',
                  animation: `${shine} 2s infinite`,
                  zIndex: 1,
                }
              }),
            }}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: logoSize.width,
                height: logoSize.height,
                animation: getAnimation(),
              }}
            >
              <Image
                src="/images/logohope.svg"
                alt="Logo"
                width={logoSize.width}
                height={logoSize.height}
                style={{
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>
          
          {/* App Name with typing animation */}
          {showAppName && (
            <Typography
              variant="h4"
              component="h1"
              align="center"
              sx={{
                mb: 5,
                fontWeight: 600,
                color: isDark ? '#fff' : '#333',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                borderRight: `3px solid ${ORANGE_COLOR}`,
                animation: `${revealText} 0.8s steps(40, end) forwards,
                           blink-caret 0.75s step-end infinite`,
                '@keyframes blink-caret': {
                  'from, to': { borderColor: 'transparent' },
                  '50%': { borderColor: ORANGE_COLOR },
                },
                animationDelay: '0.5s',
                opacity: 0,
                width: 0,
              }}
            >
              Hope Task Management
            </Typography>
          )}
          
          {/* Progress indicator */}
          {showProgress && (
            <Box sx={{ mt: showAppName ? 0 : 4, textAlign: 'center' }}>
              <CircularProgress 
                variant="determinate" 
                value={progressValue} 
                size={48}
                thickness={4}
                sx={{ 
                  color: progressColor || TEAL_COLOR,
                  mb: 2
                }}
              />
              <Typography 
                variant="body1" 
                color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'}
                sx={{ 
                  mt: 0.5,
                  animation: `${fadeInOut} 2s infinite ease-in-out`,
                  fontSize: '1rem',
                  fontWeight: 500
                }}
              >
                {message} {progressValue}%
              </Typography>
            </Box>
          )}
          
          {/* Simple message without progress */}
          {!showProgress && (
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
              <CircularProgress 
                size={24} 
                sx={{ mr: 1.5, color: ORANGE_COLOR }}
              />
              <Typography 
                variant="body1" 
                color={isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'}
              >
                {message}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Fade>
  );
} 