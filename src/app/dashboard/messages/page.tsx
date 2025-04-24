'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  OutlinedInput,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
  Drafts as DraftsIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateHuman } from '@/utils/dates';
import { SelectChangeEvent } from '@mui/material/Select';
import { useRouter } from 'next/navigation';

// Interfaces
interface User {
  _id: string;
  name: string;
  position: string;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  recipient: {
    _id: string;
    name: string;
  };
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  isTaskRelated: boolean;
  relatedTask?: {
    _id: string;
    title: string;
  };
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    content: '',
    isTaskRelated: false,
    relatedTask: ''
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Check if user can send messages (SUPER_ADMIN or MANAGER)
  const canSendMessages = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
  
  // Check if user can delete messages (SUPER_ADMIN only)
  const canDeleteMessages = user?.role === 'SUPER_ADMIN';

  // Fetch messages and users on component mount
  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  // Refresh messages when tab changes
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [selectedTab]);

  // Fetch messages from API
  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Get the appropriate folder based on the selected tab
      const folder = selectedTab === 0 ? 'inbox' : 'sent';
      
      const response = await fetch(`/api/messages?folder=${folder}&search=${searchQuery}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.success && Array.isArray(data.messages)) {
          console.log('Messages loaded from API:', data.messages.length);
          setMessages(data.messages);
          setError('');
        } else {
          console.warn('API returned success but messages is not an array:', data.messages);
          setError('Invalid response format from server');
          setMessages([]);
        }
      } else {
        console.warn('API request failed:', data.message);
        setError(data.message || 'Failed to fetch messages');
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('An error occurred while fetching messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUsers(data.users);
      } else {
        console.warn('Failed to fetch users:', data.message);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  // Fetch tasks that can be associated with messages
  const fetchTasks = async () => {
    if (!formData.recipient) return;
    
    setTasksLoading(true);
    try {
      // Fetch tasks assigned to the selected recipient
      const response = await fetch(`/api/tasks?assignedTo=${formData.recipient}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTasks(data.tasks);
      } else {
        console.warn('Failed to fetch tasks:', data.message);
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  // Fetch tasks when recipient changes
  useEffect(() => {
    if (formData.recipient && composeOpen) {
      fetchTasks();
    }
  }, [formData.recipient, composeOpen]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Open compose dialog
  const handleComposeOpen = () => {
    setFormData({
      recipient: '',
      subject: '',
      content: '',
      isTaskRelated: false,
      relatedTask: ''
    });
    setComposeOpen(true);
  };

  // Open message detail dialog
  const handleMessageDetailOpen = (message: Message) => {
    setSelectedMessage(message);
    setMessageDetailOpen(true);
    
    // Mark message as read if unread
    if (!message.isRead && message.recipient._id === user?.id) {
      markAsRead(message._id);
    }
  };

  // Open delete dialog
  const handleDeleteDialogOpen = (message: Message, event?: React.MouseEvent) => {
    // Only allow SUPER_ADMIN to open delete dialog
    if (!canDeleteMessages) {
      return;
    }
    
    if (event) {
      event.stopPropagation();
    }
    setSelectedMessage(message);
    setDeleteDialogOpen(true);
  };

  // Close all dialogs
  const handleDialogClose = () => {
    setComposeOpen(false);
    setMessageDetailOpen(false);
    setDeleteDialogOpen(false);
    setSelectedMessage(null);
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle select change
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
      // Clear related task if unchecked
      ...(name === 'isTaskRelated' && !checked ? { relatedTask: '' } : {})
    });
  };

  // Send message
  const handleSendMessage = async () => {
    if (!formData.recipient || !formData.subject || !formData.content) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: formData.recipient,
          subject: formData.subject,
          content: formData.content,
          isTaskRelated: formData.isTaskRelated,
          relatedTaskId: formData.isTaskRelated ? formData.relatedTask : undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Create a new message object to add to the state
        const newMessage = {
          _id: data.messageId || `temp-${Date.now()}`,
          sender: {
            _id: user?.id || 'current',
            name: user?.name || 'Current User'
          },
          recipient: {
            _id: formData.recipient,
            name: users.find(u => u._id === formData.recipient)?.name || 'Unknown'
          },
          subject: formData.subject,
          content: formData.content,
          isRead: true,
          createdAt: new Date().toISOString(),
          isTaskRelated: formData.isTaskRelated,
          relatedTask: formData.isTaskRelated && formData.relatedTask ? {
            _id: formData.relatedTask,
            title: tasks.find(t => t._id === formData.relatedTask)?.title || 'Related Task'
          } : undefined
        };
        
        // Update messages state by adding the new message
        setMessages(prevMessages => [newMessage, ...prevMessages]);
        setError(''); // Clear any previous errors
        handleDialogClose();
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred while sending the message');
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isRead: true })
      });
      
      if (response.ok) {
        // Update message in state
        setMessages(messages.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
        ));
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    setLoading(true);
    
    try {
      const response = await fetch(`/api/messages/${selectedMessage._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Remove the message from the list
        setMessages(messages.filter(msg => msg._id !== selectedMessage._id));
        handleDialogClose();
      } else {
        throw new Error(data.message || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('An error occurred while deleting the message');
    } finally {
      setLoading(false);
    }
  };

  // Get filtered messages based on search query and current tab
  const getFilteredMessages = () => {
    // Since we're now fetching the correct messages from the API based on tab,
    // we only need to filter by search query
    let filteredMessages = messages.filter(message => {
      if (!searchQuery) return true;
      
      // Filter by search query
      return message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.recipient.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    // Sort by date (newest first)
    return filteredMessages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const filteredMessages = getFilteredMessages();
  const unreadCount = messages.filter(msg => msg.recipient._id === user?.id && !msg.isRead).length;

  // Navigate to related task
  const handleViewRelatedTask = (taskId: string) => {
    router.push(`/dashboard/tasks/${taskId}`);
    handleDialogClose();
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, mt: 2, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EmailIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" component="h1">
              Messages
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchMessages} 
              disabled={loading}
            >
              Refresh
            </Button>
            
            {canSendMessages && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleComposeOpen}
                disabled={loading}
              >
                Compose
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Info banner for employees */}
        {user?.role === 'EMPLOYEE' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                This is a one-way communication system. You can view messages from administrators and managers, but cannot send replies.
              </Typography>
            </Box>
          </Alert>
        )}
        
        {/* Search and tabs */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel htmlFor="search-messages">Search Messages</InputLabel>
              <OutlinedInput
                id="search-messages"
                value={searchQuery}
                onChange={handleSearchChange}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                }
                endAdornment={
                  searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearSearch} edge="end">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }
                label="Search Messages"
              />
            </FormControl>
          </Box>
          
          {canSendMessages ? (
            <Tabs 
              value={selectedTab} 
              onChange={handleTabChange} 
              aria-label="message tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                icon={<InboxIcon />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Inbox
                    {unreadCount > 0 && (
                      <Chip 
                        label={unreadCount} 
                        color="primary" 
                        size="small" 
                        sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} 
                      />
                    )}
                  </Box>
                } 
                id="tab-0" 
                aria-controls="tabpanel-0" 
              />
              <Tab 
                icon={<SendIcon />} 
                label="Sent" 
                id="tab-1" 
                aria-controls="tabpanel-1" 
              />
            </Tabs>
          ) : (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
              <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
                <InboxIcon sx={{ mr: 1 }} />
                Inbox
                {unreadCount > 0 && (
                  <Chip 
                    label={unreadCount} 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }} 
                  />
                )}
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* No messages message */}
        {!loading && filteredMessages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {selectedTab === 1 ? 'You haven\'t sent any messages yet' : 'Your inbox is empty'}
            </Typography>
            {searchQuery && (
              <Typography variant="body2" color="text.secondary">
                Try using different search terms or clear your search
              </Typography>
            )}
            {selectedTab === 1 && !searchQuery && canSendMessages && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleComposeOpen}
                sx={{ mt: 2 }}
              >
                Compose a Message
              </Button>
            )}
          </Box>
        )}
        
        {/* Messages list */}
        {!loading && filteredMessages.length > 0 && (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {filteredMessages.map((message, index) => (
              <React.Fragment key={message._id}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ 
                    py: 2,
                    bgcolor: selectedTab === 0 && !message.isRead ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                  onClick={() => handleMessageDetailOpen(message)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: selectedTab === 0 ? 'primary.main' : 'secondary.main' }}>
                      {canSendMessages && selectedTab === 1 
                        ? message.recipient.name.charAt(0).toUpperCase()
                        : message.sender.name.charAt(0).toUpperCase()
                      }
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography 
                            component="span" 
                            variant="body1"
                            sx={{ 
                              fontWeight: selectedTab === 0 && !message.isRead ? 700 : 400,
                              mr: 1
                            }}
                          >
                            {message.subject}
                          </Typography>
                          {message.isTaskRelated && (
                            <Chip
                              label="Task"
                              size="small"
                              color="secondary"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mr: 1 }}
                          >
                            {formatDateHuman(new Date(message.createdAt))}
                          </Typography>
                          {canDeleteMessages && (
                            <IconButton 
                              size="small" 
                              edge="end" 
                              aria-label="delete"
                              onClick={(e) => handleDeleteDialogOpen(message, e)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: 'block', mt: 0.5 }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {canSendMessages && selectedTab === 1 ? `To: ${message.recipient.name}` : `From: ${message.sender.name}`}
                        </Typography>
                        <Typography
                          sx={{ display: 'block', mt: 0.5 }}
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {message.content.length > 100
                            ? `${message.content.substring(0, 100)}...`
                            : message.content}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < filteredMessages.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Compose Dialog - Only for SUPER_ADMIN and MANAGER */}
      {canSendMessages && (
        <Dialog open={composeOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
          <DialogTitle>Compose Message</DialogTitle>
          <DialogContent dividers>
            <FormControl fullWidth margin="normal">
              <InputLabel id="recipient-label">Recipient</InputLabel>
              <Select
                labelId="recipient-label"
                id="recipient"
                name="recipient"
                value={formData.recipient}
                onChange={handleSelectChange}
                label="Recipient"
              >
                {users
                  .filter(u => u._id !== user?.id)
                  .map(u => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.name} ({u.position})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            
            <TextField
              name="subject"
              label="Subject"
              value={formData.subject}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
            
            <TextField
              name="content"
              label="Message"
              value={formData.content}
              onChange={handleInputChange}
              fullWidth
              required
              multiline
              rows={6}
              margin="normal"
            />
            
            {formData.recipient && (
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isTaskRelated}
                      onChange={handleCheckboxChange}
                      name="isTaskRelated"
                    />
                  }
                  label="Related to a task"
                />
                
                {formData.isTaskRelated && (
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="task-label">Select Related Task</InputLabel>
                    <Select
                      labelId="task-label"
                      id="relatedTask"
                      name="relatedTask"
                      value={formData.relatedTask}
                      onChange={handleSelectChange}
                      label="Select Related Task"
                      disabled={tasksLoading || tasks.length === 0}
                    >
                      {tasksLoading ? (
                        <MenuItem disabled>Loading tasks...</MenuItem>
                      ) : tasks.length === 0 ? (
                        <MenuItem disabled>No tasks available</MenuItem>
                      ) : (
                        tasks.map(task => (
                          <MenuItem key={task._id} value={task._id}>
                            {task.title} ({task.status})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {tasks.length === 0 && !tasksLoading && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        No tasks found for this recipient.
                      </Typography>
                    )}
                  </FormControl>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button 
              onClick={handleSendMessage} 
              variant="contained" 
              startIcon={<SendIcon />}
              disabled={loading || !formData.recipient || !formData.subject || !formData.content || 
                (formData.isTaskRelated && !formData.relatedTask)}
            >
              Send
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={messageDetailOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>{selectedMessage.subject}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  <strong>From:</strong> {selectedMessage.sender.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDateHuman(new Date(selectedMessage.createdAt))}
                </Typography>
              </Box>
              <Typography variant="body2">
                <strong>To:</strong> {selectedMessage.recipient.name}
              </Typography>
              {selectedMessage.isTaskRelated && selectedMessage.relatedTask && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Related Task:</strong> {selectedMessage.relatedTask.title}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => handleViewRelatedTask(selectedMessage.relatedTask?._id || '')}
                  >
                    View Task
                  </Button>
                </Box>
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {selectedMessage.content}
            </Typography>
          </DialogContent>
          <DialogActions>
            {canDeleteMessages && (
              <Button 
                onClick={() => handleDeleteDialogOpen(selectedMessage)}
                color="error"
              >
                Delete
              </Button>
            )}
            <Button onClick={handleDialogClose}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Delete Dialog - Only for SUPER_ADMIN */}
      {canDeleteMessages && (
        <Dialog open={deleteDialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Delete Message</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this message? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button 
              onClick={handleDeleteMessage} 
              variant="contained" 
              color="error" 
              disabled={loading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
} 