import React from 'react';
import { Box, Typography, Avatar, useTheme, useMediaQuery } from '@mui/material';
import { Person as PersonIcon, SmartToy as AssistantIcon } from '@mui/icons-material';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

const MessageBubble = ({ message, isUser, timestamp }: MessageBubbleProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? 'secondary.main' : 'primary.main',
          width: 32,
          height: 32,
          flexShrink: 0,
          mt: 0.5,
          mx: 1,
        }}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <AssistantIcon fontSize="small" />}
      </Avatar>
      <Box
        sx={{
          bgcolor: isUser ? 'secondary.light' : 'primary.light',
          color: isUser ? 'secondary.contrastText' : 'primary.contrastText',
          p: 2,
          borderRadius: 2,
          maxWidth: '75%',
          boxShadow: 1,
        }}
      >
        <Typography 
          variant="body1"
          sx={{ 
            whiteSpace: 'pre-wrap',
          }}
        >
          {message}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            color: isUser ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
            textAlign: 'right',
          }}
        >
          {format(new Date(timestamp), 'h:mm a')}
        </Typography>
      </Box>
    </Box>
  );
};

export default MessageBubble; 