import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Paper,
  Divider,
  Fab,
  Zoom,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  SmartToy as AssistantIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import MessageBubble from './MessageBubble';
import { useAssistant } from '@/contexts/AssistantContext';

const AssistantWidget = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { messages, sendMessage, isLoading } = useAssistant();
  
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!open && (
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <AssistantIcon />
        </Fab>
      )}

      {open && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 350,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            borderRadius: 2,
            overflow: 'hidden',
            '@media (max-width: 600px)': {
              width: 'calc(100% - 40px)',
              height: 'calc(100% - 100px)',
            },
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssistantIcon />
              <Typography variant="h6">Task Assistant</Typography>
            </Box>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider />
          
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              bgcolor: theme.palette.background.default,
              p: 2,
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography 
                  color="textSecondary" 
                  align="center"
                >
                  Hi! I'm your task assistant. Ask me anything about your tasks or how to use the system.
                </Typography>
              </Box>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message.content}
                  isUser={message.role === 'user'}
                  timestamp={message.timestamp}
                />
              ))
            )}
            
            {isLoading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  my: 2,
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!newMessage.trim() || isLoading}
                sx={{ alignSelf: 'flex-end' }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default AssistantWidget; 