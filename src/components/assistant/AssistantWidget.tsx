import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Drawer,
  Fab,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  SmartToy as AssistantIcon,
  Send as SendIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Minimize as MinimizeIcon,
  AddTask as AddTaskIcon,
  NotificationsActive as NotificationsActiveIcon,
  Email as EmailIcon,
  FormatListBulleted as FormatListBulletedIcon,
  Alarm as AlarmIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import MessageBubble from './MessageBubble';
import TaskSelectionDialog from './TaskSelectionDialog';
import UserSelectionDialog from './UserSelectionDialog';
import CreateTaskDialog from './CreateTaskDialog';
import CreateNoticeDialog from './CreateNoticeDialog';
import SendMessageDialog from './SendMessageDialog';
import TaskManagementDialog from './TaskManagementDialog';
import TaskDetailsDialog from './TaskDetailsDialog';
import { useAssistant } from '@/contexts/AssistantContext';
import { useTasks } from '@/contexts/TaskContext';
import { useUsers } from '@/contexts/UserContext';
import { User, UserRole } from '@/types/User';
import { Task } from '@/types/Task';

const GREETING_SHOWN_KEY = 'assistant_greeting_shown';

const AssistantWidget = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    sendReminder, 
    sendReminders,
    openTaskCreationDialog,
    openNoticeCreationDialog,
    openMessageSendingDialog,
    resetMessages,
  } = useAssistant();
  const { tasks } = useTasks();
  const usersContext = useUsers();
  const { users } = usersContext;
  
  // Task selection dialog state
  const [taskSelectionOpen, setTaskSelectionOpen] = useState(false);
  const [taskDialogTitle, setTaskDialogTitle] = useState('');
  const [targetUser, setTargetUser] = useState<string | undefined>();
  const [targetUserName, setTargetUserName] = useState<string | undefined>();
  
  // User selection dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  
  // Add local loading state for user loading
  const [isUserLoading, setIsUserLoading] = useState(false);
  
  // Dialog states
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createNoticeOpen, setCreateNoticeOpen] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [taskManagementOpen, setTaskManagementOpen] = useState(false);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  
  // Add state for tracking task details flow
  const [taskDetailsFlow, setTaskDetailsFlow] = useState({
    isActive: false,
    step: 'user', // 'user', 'task', 'details'
  });
  
  // Add state for task details selection dialog
  const [taskDetailsSelectionOpen, setTaskDetailsSelectionOpen] = useState(false);
  
  // Debug logs
  useEffect(() => {
    if (open) {
      console.log('AssistantWidget - Available tasks:', tasks);
      console.log('AssistantWidget - Available users:', users);
      console.log('AssistantWidget - Context functions:', {
        openTaskCreationDialog,
        openNoticeCreationDialog,
        openMessageSendingDialog
      });
    }
  }, [open, tasks, users, openTaskCreationDialog, openNoticeCreationDialog, openMessageSendingDialog]);
  
  // Add toggle handler that resets chat when opening
  const handleToggleWidget = (isOpen: boolean) => {
    if (isOpen) {
      // Reset messages when opening the widget
      resetMessages();
      console.log('AssistantWidget - Starting new chat session');
      
      // Reset local storage to ensure greeting shows
      localStorage.removeItem(GREETING_SHOWN_KEY);
    }
    setOpen(isOpen);
  };
  
  // Check if greeting has been shown this session
  const hasGreetingBeenShown = () => {
    return messages.length > 0 || localStorage.getItem(GREETING_SHOWN_KEY) === 'true';
  };
  
  // Send a greeting if needed
  useEffect(() => {
    if (open && messages.length === 0 && !isLoading && !hasGreetingBeenShown()) {
      // Send initial greeting
      sendMessage("Hello");
      // Mark greeting as shown
      localStorage.setItem(GREETING_SHOWN_KEY, 'true');
    }
  }, [open, messages.length, isLoading, sendMessage]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Replace the refreshUsers function with an improved version
  const refreshUsers = useCallback(async () => {
    if (users.length === 0) {
      setIsUserLoading(true);
      try {
        await usersContext.fetchUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsUserLoading(false);
      }
    }
  }, [usersContext, users.length]);

  // Call the refresh function when opened
  useEffect(() => {
    if (open) {
      refreshUsers();
    }
  }, [open, refreshUsers]);

  // Open the task selection dialog
  const handleOpenTaskSelection = (userId?: string, userName?: string) => {
    setTargetUser(userId);
    setTargetUserName(userName);
    setTaskSelectionOpen(true);
  };
  
  // Open the create task dialog
  const handleOpenCreateTask = () => {
    console.log('Opening create task dialog from widget');
    setCreateTaskOpen(true);
    // Also call the context function
    if (openTaskCreationDialog) {
      openTaskCreationDialog();
    }
  };
  
  // Open the create notice dialog
  const handleOpenCreateNotice = () => {
    console.log('Opening create notice dialog from widget');
    setCreateNoticeOpen(true);
    // Also call the context function
    if (openNoticeCreationDialog) {
      openNoticeCreationDialog();
    }
  };
  
  // Open the send message dialog
  const handleOpenSendMessage = (userId?: string) => {
    console.log('Opening send message dialog from widget');
    setTargetUser(userId);
    setSendMessageOpen(true);
    // Also call the context function
    if (openMessageSendingDialog) {
      openMessageSendingDialog(userId);
    }
  };
  
  // Open the task management dialog
  const handleOpenTaskManagement = () => {
    console.log('Opening task management dialog from widget');
    setTaskManagementOpen(true);
  };
  
  // Handle task creation completion
  const handleTaskCreated = (task: Task) => {
    if (usersContext && usersContext.fetchUsers) {
      // Refresh users after task creation
      usersContext.fetchUsers();
    }
    
    sendMessage(`Created new task: ${task.title}`);
    setCreateTaskOpen(false);
  };
  
  // Handle notice creation completion
  const handleNoticeCreated = (notice: any) => {
    sendMessage(`Posted new notice: ${notice.title}`);
    setCreateNoticeOpen(false);
  };
  
  // Handle message sending completion
  const handleMessageSent = (message: any) => {
    sendMessage(`Sent message to ${message.recipient.name}: ${message.subject}`);
    setSendMessageOpen(false);
  };
  
  // Update the options menu to include new actions
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    // Implementation of handleOpenMenu
  };
  
  const handleCloseMenu = () => {
    // Implementation of handleCloseMenu
  };
  
  const handleMenuAction = (action: string) => {
    handleCloseMenu();
    
    switch (action) {
      case 'create-task':
        handleOpenCreateTask();
        break;
      case 'create-notice':
        handleOpenCreateNotice();
        break;
      case 'send-message':
        handleOpenSendMessage();
        break;
      case 'list-tasks':
        handleOpenTaskManagement();
        break;
      default:
        // Other actions
        break;
    }
  };

  // Handle AI responses that contain special commands
  const handleAssistantResponse = (response: string) => {
    // Check for task details command
    const taskDetailsMatch = response.match(/__OPEN_TASK_DETAILS:([a-z0-9-]+)__/i);
    if (taskDetailsMatch && taskDetailsMatch[1]) {
      const taskId = taskDetailsMatch[1];
      console.log('Opening task details from assistant command:', taskId);
      
      // Open the task details dialog
      handleOpenTaskDetails(taskId);
      
      // Return true to indicate we handled this response
      return true;
    }
    
    // Not a special command
    return false;
  };
  
  // Handle reminder request by finding user to send reminder to
  const handleReminderRequest = (message: string) => {
    // Skip processing for common greetings
    const commonGreetings = ['hi', 'hello', 'hey', 'hola', 'greetings', 'howdy'];
    if (commonGreetings.includes(message.toLowerCase().trim())) {
      return false;
    }
    
    // Check if the message contains reminder-related keywords
    const isReminderKeyword = 
      message.toLowerCase().includes('remind') || 
      message.toLowerCase().includes('reminder');
      
    // If the message is very short (1-2 words) and doesn't contain reminder keywords,
    // don't treat it as a reminder request
    if (message.trim().split(/\s+/).length <= 2 && !isReminderKeyword) {
      return false;
    }
    
    // Try different patterns to extract username from the message
    const userMatch = message.match(/remind\s+(.+?)(?:\s+about|\s+of|\s+for|$)/i) || 
                     message.match(/send\s+(?:a\s+)?reminder\s+(?:to\s+)?(.+?)(?:\s+about|\s+of|\s+for|$)/i) ||
                     message.match(/(?:send|give)\s+(.+?)\s+(?:a\s+)?reminder/i);
    
    // If no user found, try to see if the message itself is just a username
    let potentialUsername = '';
    
    if (userMatch && userMatch[1]) {
      potentialUsername = userMatch[1].trim().toLowerCase();
    } else if (isReminderKeyword) {
      // Only attempt username matching if there's a reminder keyword
      potentialUsername = message.trim().toLowerCase();
    }
    
    // Look for username match, more permissive matching (contains)
    const user = users.find(u => 
      u.username.toLowerCase() === potentialUsername ||
      u.username.toLowerCase().includes(potentialUsername) ||
      potentialUsername.includes(u.username.toLowerCase())
    );
    
    console.log(`Looking for user with pattern: "${potentialUsername}"`, users.map(u => u.username));
    
    if (user) {
      // We found a user to remind
      setTargetUser(user.id);
      setTargetUserName(user.username);
      setTaskDialogTitle(`Select Tasks to Remind ${user.username}`);
      setTaskSelectionOpen(true);
      setNewMessage(''); // Clear the input
      return true;
    } else {
      // Check if this is explicitly a reminder-related message
      
      // If it's a reminder request but we can't find a user, show user selection dialog
      if (isReminderKeyword) {
        // Show user selection dialog
        setNewMessage('');
        setUserDialogOpen(true);
        return true;
      }
      
      // No user found, let the normal message flow handle it
      return false;
    }
  };
  
  // Handle special commands for task progress updates
  const handleCheckTaskProgress = () => {
    console.log('Opening task progress report');
    sendMessage("show me task progress updates");
  };

  // Add message handling for specific commands
  const handleSpecialCommands = (message: string): boolean => {
    const lowerMessage = message.toLowerCase().trim();
    
    // Handle special commands
    if (lowerMessage === 'create task' || lowerMessage === 'create a task' || lowerMessage === 'new task') {
      console.log('Opening task creation dialog from command');
      // Send the message first, so the assistant can respond
      sendMessage(message);
      // Then open the dialog
      handleOpenCreateTask();
      setNewMessage('');
      return true;
    }
    
    // Progress updates command
    if (lowerMessage.includes('progress update') || 
        lowerMessage.includes('task progress') || 
        lowerMessage.includes('progress report') || 
        lowerMessage.includes('status update')) {
      console.log('Getting task progress updates');
      sendMessage(message);
      setNewMessage('');
      return true;
    }
    
    if (lowerMessage === 'create notice' || lowerMessage === 'create a notice' || lowerMessage === 'post notice') {
      console.log('Opening notice creation dialog from command');
      // Send the message first, so the assistant can respond
      sendMessage(message);
      // Then open the dialog
      handleOpenCreateNotice();
      setNewMessage('');
      return true;
    }
    
    if (lowerMessage === 'send message' || lowerMessage === 'send a message' || lowerMessage === 'message') {
      console.log('Opening message dialog from command');
      // Send the message first, so the assistant can respond
      sendMessage(message);
      // Then open the dialog
      handleOpenSendMessage();
      setNewMessage('');
      return true;
    }
    
    // Handle 'show tasks' or 'view tasks' commands
    if (lowerMessage === 'show tasks' || lowerMessage === 'view tasks' || lowerMessage === 'my tasks' || lowerMessage === 'list tasks') {
      console.log('Opening task management dialog from command');
      // Send the message first, so the assistant can respond
      sendMessage(message);
      // Then open the dialog
      handleOpenTaskManagement();
      setNewMessage('');
      return true;
    }
    
    return false;
  };
  
  const handleSend = useCallback(() => {
    const messageText = newMessage.trim();
    
    if (!messageText) return;

    // Check for special commands
    const handled = handleSpecialCommands(messageText);
    
    if (!handled) {
      // Check for reminder requests
      const isReminderRequest = handleReminderRequest(messageText);
      
      // If it's not a reminder request, send as a normal message
      if (!isReminderRequest) {
        sendMessage(messageText);
      }
    }
    
    // Clear input field
    setNewMessage('');
  }, [
    newMessage, 
    sendMessage,
    // These functions use state variables so we need to include them
    handleReminderRequest,
    handleSpecialCommands,
  ]);
  
  // Handle sending reminders for selected tasks
  const handleSendReminders = async (selectedTasks: Task[]) => {
    if (!targetUser || selectedTasks.length === 0) return;
    
    // First send the user message to the chat
    const userMessageText = `Send reminders to ${targetUserName} for ${selectedTasks.length} task(s)`;
    sendMessage(userMessageText);
    
    try {
      // Get all task IDs
      const taskIds = selectedTasks.map(task => task.id);
      
      // Send reminders for all tasks at once
      await sendReminders(taskIds, targetUser);
      
      // Reset dialog state
      setNewMessage('');
      setTaskSelectionOpen(false);
      
      // Add a small delay before resetting state variables
      setTimeout(() => {
        setTargetUser(undefined);
        setTargetUserName(undefined);
        setTaskDialogTitle('');
      }, 500);
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      // Error is handled by the context
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine drawer width based on screen size for drawer wrapper
  const drawerWidth = '100%';
  
  // Dynamic colors based on theme
  const isDark = theme.palette.mode === 'dark';
  const accentColor = '#EE6417'; // Orange accent color
  const headerBg = isDark ? '#1E1E1E' : '#222222';
  const messagesBg = isDark ? '#121212' : '#F7F7F7';
  const inputBg = isDark ? '#1A1A1A' : '#FFFFFF';

  // Handle opening task details dialog
  const handleOpenTaskDetails = (taskId?: string) => {
    console.log('Opening task details for task:', taskId);
    setSelectedTaskId(taskId);
    setTaskDetailsOpen(true);
  };

  // Handle initiating task details flow
  const handleInitiateTaskDetailsFlow = () => {
    setTaskDetailsFlow({
      isActive: true,
      step: 'user'
    });
    // Open user selection dialog with appropriate title
    setUserDialogOpen(true);
  };

  // Extend the user selection handler to properly handle different flows
  const handleUserSelected = (selectedUser: User) => {
    setUserDialogOpen(false);
    setTargetUser(selectedUser.id);
    setTargetUserName(selectedUser.username);
    
    // Check if we're in task details flow or reminder flow
    if (taskDetailsFlow.isActive) {
      setTaskDialogTitle(`Select Task to View Details for ${selectedUser.username}`);
      setTaskDetailsFlow(prev => ({...prev, step: 'task'}));
      setTaskDetailsSelectionOpen(true); // Open the task details selection dialog instead
    } else {
      // Regular reminder flow
      setTaskDialogTitle(`Select Tasks to Remind ${selectedUser.username}`);
      setTaskSelectionOpen(true);
    }
  };

  // Handle task selection for task details
  const handleTaskDetailsSelected = (selectedTasks: Task[]) => {
    setTaskDetailsSelectionOpen(false);
    
    // If a task was selected
    if (selectedTasks.length > 0) {
      const selectedTask = selectedTasks[0]; // Take the first task
      setSelectedTaskId(selectedTask.id);
      setTaskDetailsFlow(prev => ({...prev, step: 'details'}));
      setTaskDetailsOpen(true);
    } else {
      // Reset flow if no task was selected
      setTaskDetailsFlow({
        isActive: false,
        step: 'user'
      });
    }
  };
  
  // Reset the task details flow when dialog closes
  const handleTaskDetailsDialogClose = () => {
    setTaskDetailsSelectionOpen(false);
    
    // Reset task details flow if it was active
    if (taskDetailsFlow.isActive) {
      setTaskDetailsFlow({
        isActive: false,
        step: 'user'
      });
    }
  };

  // Check for special commands in assistant responses
  useEffect(() => {
    // Look for the most recent assistant message
    const lastAssistantMessage = [...messages].reverse().find(msg => msg.role === 'assistant');
    
    if (lastAssistantMessage) {
      // Process any special commands
      const isCommandHandled = handleAssistantResponse(lastAssistantMessage.content);
      
      // If we processed a command, we might want to remove or replace that message
      if (isCommandHandled) {
        console.log('Handled special command in assistant message');
        // For now, we'll leave the message as-is, but you could remove it if desired
      }
    }
  }, [messages]);

  return (
    <>
      {/* Floating action button to open the assistant */}
      {!open && (
        <Fab
          onClick={() => handleToggleWidget(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            bgcolor: accentColor,
            color: 'white',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: isDark ? '#FF7A37' : '#D65000',
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.25)',
            },
          }}
        >
          <AssistantIcon />
        </Fab>
      )}

      {/* Assistant drawer */}
      <Drawer
        open={open}
        anchor="right"
        variant="temporary"
        onClose={() => handleToggleWidget(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : '450px',
            maxWidth: isMobile ? '100vw' : '500px',
            borderTopLeftRadius: isMobile ? 0 : 8,
            borderBottomLeftRadius: isMobile ? 0 : 8,
            borderRadius: isMobile ? 0 : undefined,
            outline: 'none',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            margin: isMobile ? 0 : undefined,
          },
        }}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          '& .MuiBackdrop-root': {
            backgroundColor: alpha('#000', 0.4),
          },
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : undefined,
            boxSizing: 'border-box',
            border: isMobile ? 'none' : undefined,
            right: 0,
            left: 'auto',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: headerBg,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `2px solid ${accentColor}`,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: accentColor, 
              borderRadius: '50%',
              p: 0.8,
            }}>
              <AssistantIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '0.5px' }}>
                Task Assistant
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 300 }}>
                {isLoading ? 'Thinking...' : 'Ready to help'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => handleToggleWidget(false)}
              sx={{ 
                color: 'white',
                opacity: 0.8,
                '&:hover': { opacity: 1, color: accentColor },
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {/* Messages area */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 3,
              bgcolor: messagesBg,
              '&::-webkit-scrollbar': {
                width: '6px',
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: '3px',
              },
              scrollBehavior: 'smooth',
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  opacity: 0.7,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    '& svg': {
                      fontSize: 40,
                      opacity: 0.6,
                      color: accentColor
                    }
                  }}>
                    <AssistantIcon fontSize="large" />
                  </Box>
                  <Typography 
                    color="textSecondary" 
                    align="center"
                    sx={{ 
                      fontWeight: 300,
                      fontSize: '1rem',
                    }}
                  >
                    {isLoading ? "Loading..." : "Initializing assistant..."}
                  </Typography>
                </Box>
              </Box>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message.content}
                  isUser={message.role === 'user'}
                  timestamp={message.timestamp}
                  accentColor={accentColor}
                  isNewMessage={message.role === 'assistant' && index === messages.length - 1}
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
                <CircularProgress 
                  size={28} 
                  thickness={4}
                  sx={{ 
                    color: accentColor,
                  }}
                />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Input area */}
          <Box 
            sx={{ 
              p: 2,
              bgcolor: inputBg,
              borderTop: isDark ? '1px solid #333' : '1px solid #E5E5E5',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {/* Quick action buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 1,
              mb: 2,
              justifyContent: isMobile ? 'center' : 'flex-start',
              maxHeight: isMobile ? '120px' : 'auto',
              overflowY: isMobile ? 'auto' : 'visible',
            }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddTaskIcon />}
                onClick={handleOpenCreateTask}
                sx={{ 
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  color: accentColor,
                  '&:hover': { borderColor: accentColor },
                  fontSize: '0.75rem',
                }}
              >
                Create Task
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<NotificationsActiveIcon />}
                onClick={handleOpenCreateNotice}
                sx={{ 
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  color: accentColor,
                  '&:hover': { borderColor: accentColor },
                  fontSize: '0.75rem',
                }}
              >
                Post Notice
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AlarmIcon />}
                onClick={() => setUserDialogOpen(true)}
                sx={{ 
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                  color: accentColor,
                  '&:hover': { borderColor: accentColor },
                  fontSize: '0.75rem',
                }}
              >
                Send Reminder
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EmailIcon />}
                onClick={() => handleOpenSendMessage()}
                sx={{ 
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                  color: accentColor,
                  '&:hover': { borderColor: accentColor },
                  fontSize: '0.75rem',
                }}
              >
                Send Message
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FormatListBulletedIcon />}
                onClick={handleOpenTaskManagement}
                sx={{ 
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                  color: accentColor,
                  '&:hover': { borderColor: accentColor },
                  fontSize: '0.75rem',
                }}
              >
                My Tasks
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AssessmentIcon />}
                onClick={handleCheckTaskProgress}
                sx={{ 
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                  color: accentColor,
                  '&:hover': { borderColor: accentColor },
                  fontSize: '0.75rem',
                }}
              >
                Progress Report
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<InfoIcon />}
                onClick={handleInitiateTaskDetailsFlow}
                sx={{ 
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                  color: accentColor,
                  '&:hover': { borderColor: accentColor },
                  fontSize: '0.75rem',
                }}
              >
                Task Details
              </Button>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              backgroundColor: isDark ? '#2A2A2A' : '#F2F2F2',
              borderRadius: 2,
              padding: '4px 16px 4px 16px',
            }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={3}
                InputProps={{
                  disableUnderline: true
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    fontWeight: 400,
                    p: 1,
                  },
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'flex-end', pb: 1 }}>
                <IconButton
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isLoading}
                  sx={{ 
                    ml: 0.5,
                    bgcolor: accentColor,
                    color: 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isDark ? '#FF7A37' : '#D65000',
                    },
                    '&.Mui-disabled': {
                      bgcolor: isDark ? '#333' : '#E0E0E0',
                      color: isDark ? '#555' : '#A0A0A0',
                    },
                    width: 32,
                    height: 32,
                  }}
                  size="small"
                >
                  <SendIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>
      
      {/* Task Selection Dialog */}
      <TaskSelectionDialog
        open={taskSelectionOpen}
        onClose={() => setTaskSelectionOpen(false)}
        onSend={handleSendReminders}
        tasks={tasks}
        title={taskDialogTitle}
        targetUser={targetUser}
        targetUserName={targetUserName}
        singleSelect={false}
      />

      {/* Task Details Selection Dialog */}
      <TaskSelectionDialog
        open={taskDetailsSelectionOpen}
        onClose={handleTaskDetailsDialogClose}
        onSend={handleTaskDetailsSelected}
        tasks={tasks}
        title={taskDialogTitle}
        targetUser={targetUser}
        targetUserName={targetUserName}
        singleSelect={true}
      />

      {/* User Selection Dialog */}
      <UserSelectionDialog
        open={userDialogOpen}
        onClose={() => {
          setUserDialogOpen(false);
          setTaskDetailsFlow({ isActive: false, step: 'user' });
        }}
        onSelect={handleUserSelected}
        users={users}
        title={taskDetailsFlow.isActive ? "Select User to View Task Details" : "Select User to Remind"}
        loading={isUserLoading}
      />

      {/* Dropdown menu for actions */}
      <Menu
        anchorEl={null}
        open={false}
        onClose={() => {}}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleMenuAction('create-task')}>
          <ListItemIcon>
            <AddTaskIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create New Task</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('create-notice')}>
          <ListItemIcon>
            <NotificationsActiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Post Announcement</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('send-message')}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Message</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('list-tasks')}>
          <ListItemIcon>
            <FormatListBulletedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View My Tasks</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
      
      {/* Create Notice Dialog */}
      <CreateNoticeDialog
        open={createNoticeOpen}
        onClose={() => setCreateNoticeOpen(false)}
        onNoticeCreated={handleNoticeCreated}
      />
      
      {/* Send Message Dialog */}
      <SendMessageDialog
        open={sendMessageOpen}
        onClose={() => setSendMessageOpen(false)}
        recipientId={targetUser}
        onMessageSent={handleMessageSent}
      />

      {/* Task Management Dialog */}
      <TaskManagementDialog
        open={taskManagementOpen}
        onClose={() => setTaskManagementOpen(false)}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        open={taskDetailsOpen}
        onClose={() => setTaskDetailsOpen(false)}
        taskId={selectedTaskId}
        userId={targetUser}
        users={users}
        tasks={tasks}
      />
    </>
  );
};

export default AssistantWidget; 