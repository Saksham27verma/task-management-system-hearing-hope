import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date; // Kept for compatibility but not displayed
  accentColor?: string; // Optional accent color
  isNewMessage?: boolean; // Flag to indicate if this is a new message that should animate
}

const TypingAnimation = ({ color }: { color: string }) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
      {[0, 1, 2].map((dot) => (
        <Box
          key={dot}
          sx={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: color,
            opacity: 0.7,
            animation: 'typing 1s infinite',
            animationDelay: `${dot * 0.15}s`,
            '@keyframes typing': {
              '0%': {
                transform: 'translateY(0)',
              },
              '50%': {
                transform: 'translateY(-5px)',
              },
              '100%': {
                transform: 'translateY(0)',
              },
            },
          }}
        />
      ))}
    </Box>
  );
};

const MessageBubble = ({ message, isUser, accentColor = '#EE6417', isNewMessage = false }: MessageBubbleProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // State to track if typing animation is complete
  const [isTyping, setIsTyping] = useState(!isUser && isNewMessage);
  const [visibleText, setVisibleText] = useState(isUser || !isNewMessage ? message : '');
  
  // Set colors based on props and theme
  const userBubbleColor = isDark ? '#333333' : '#444444';
  const userTextColor = '#FFFFFF';
  const assistantTextColor = accentColor;
  
  // Typing animation effect for assistant messages - only run for new messages
  useEffect(() => {
    if (isUser || !isNewMessage) return;
    
    let currentIndex = 0;
    const typingSpeed = 15; // faster typing (was 30)
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= message.length) {
        setVisibleText(message.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, [isUser, message, isNewMessage]);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 2.5,
        maxWidth: '100%',
        px: { xs: 0, sm: 1 },
      }}
    >
      {/* Different styling for user vs assistant messages */}
      {isUser ? (
        <Box
          sx={{
            bgcolor: userBubbleColor,
            color: userTextColor,
            p: 2,
            borderRadius: '14px',
            maxWidth: { xs: '95%', sm: '80%' },
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          <Typography 
            variant="body1"
            sx={{ 
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              fontWeight: 400,
              lineHeight: 1.5,
              letterSpacing: '0.2px',
              fontSize: { xs: '1rem', sm: '0.95rem' },
            }}
          >
            {message}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            p: '8px 12px',
            color: assistantTextColor,
            maxWidth: { xs: '100%', sm: '85%' },
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          <Typography 
            variant="body1"
            sx={{ 
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              fontWeight: 500,
              lineHeight: 1.6,
              letterSpacing: '0.2px',
              fontSize: { xs: '1rem', sm: '0.95rem' },
              minHeight: '20px',
            }}
          >
            {visibleText}
          </Typography>
          
          {/* Show typing animation while message is being typed */}
          {isTyping && <TypingAnimation color={assistantTextColor} />}
        </Box>
      )}
    </Box>
  );
};

export default MessageBubble; 