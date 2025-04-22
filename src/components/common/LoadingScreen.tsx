'use client';

import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Fade, keyframes, useTheme } from '@mui/material';
import Image from 'next/image';
import { useThemeMode } from '@/contexts/ThemeContext';

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
  0%, 100% { box-shadow: 0 0 30px rgba(238, 100, 23, 0.4); }
  50% { box-shadow: 0 0 50px rgba(238, 100, 23, 0.7); }
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 3,
            animation: `${revealLogo} 0.8s ease forwards`,
          }}
        >
          {/* Logo with enhanced styling and effects */}
          <Box 
            sx={{ 
              position: 'relative',
              mb: 2,
              p: 2,
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              boxShadow: isDark 
                ? '0 0 30px rgba(238, 100, 23, 0.4)' 
                : '0 0 30px rgba(238, 100, 23, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: logoSize.width + 60,
              height: logoSize.height + 60,
              transition: 'all 0.3s ease-in-out',
              ...(logoBackgroundEffect === 'glow' && {
                animation: `${glow} 2.5s infinite ease-in-out`,
              }),
              '&:hover': {
                boxShadow: isDark 
                  ? '0 0 40px rgba(238, 100, 23, 0.5)' 
                  : '0 0 40px rgba(238, 100, 23, 0.3)',
              },
              overflow: 'hidden',
              '&::before': logoBackgroundEffect === 'ripple' ? {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                opacity: 0.2,
                animation: `${ripple} 2s infinite ease-out`,
              } : {},
              // Enhanced border glow
              border: `1px solid ${isDark 
                ? 'rgba(238, 100, 23, 0.3)' 
                : 'rgba(238, 100, 23, 0.1)'}`,
            }}
          >
            {logoBackgroundEffect === 'ripple' && (
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.1,
                    animation: `${ripple} 2s infinite ease-out 0.5s`,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.05,
                    animation: `${ripple} 2s infinite ease-out 1s`,
                  }}
                />
              </>
            )}
            
            <Box
              sx={{
                animation: getAnimation(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                '&::after': animationStyle === 'shine' ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(
                    90deg, 
                    transparent, 
                    ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)'}, 
                    transparent
                  )`,
                  maskImage: 'linear-gradient(#fff 0 0)',
                  maskSize: '200% 100%',
                  animation: `${shine} 2.5s infinite`,
                } : {},
              }}
            >
              <Image
                src="/images/logohope.svg"
                alt="Hearing Hope Logo"
                width={logoSize.width}
                height={logoSize.height}
                priority
                style={{ 
                  objectFit: 'contain',
                  filter: isDark 
                    ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' 
                    : 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
                }}
              />
            </Box>
          </Box>
          
          {/* App name display */}
          {showAppName && (
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                mb: 1,
                color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                fontWeight: 500,
                animation: `${revealText} 1s ease forwards`,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                textShadow: isDark 
                  ? '0 0 10px rgba(238, 100, 23, 0.5)' 
                  : 'none',
              }}
            >
              Hearing Hope
            </Typography>
          )}
          
          {/* Loading message */}
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 2,
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              animation: `${revealText} 0.8s 0.3s ease forwards`,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              opacity: 0,
              fontSize: '1.1rem',
            }}
          >
            {message}
          </Typography>
          
          {/* Progress indicator */}
          {showProgress && (
            <Box sx={{ 
              position: 'relative', 
              mt: 1,
              width: '180px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CircularProgress 
                variant="determinate" 
                value={progressValue}
                size={40} 
                thickness={4}
                sx={{ 
                  color: progressColor || theme.palette.primary.main,
                  // Add shadow for better visibility
                  filter: isDark 
                    ? 'drop-shadow(0 0 3px rgba(238, 100, 23, 0.5))' 
                    : 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  component="div"
                  sx={{ 
                    color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  {`${Math.round(progressValue)}%`}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Fade>
  );
} 