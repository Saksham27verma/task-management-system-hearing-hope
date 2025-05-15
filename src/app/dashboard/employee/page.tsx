'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import { 
  AssignmentOutlined, 
  CalendarTodayOutlined, 
  CheckCircleOutline, 
  HourglassEmptyOutlined,
  WarningOutlined,
  ArrowForward,
  NotificationsOutlined,
  EmailOutlined
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'in progress':
      return 'info';
    case 'pending':
      return 'warning';
    case 'delayed':
      return 'error';
    default:
      return 'default';
  }
};

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  
  // Theme colors
  const orangeColor = '#F26722'; // Orange color
  const tealColor = '#19ac8b'; // Teal color
  const lightOrange = '#FFF1E8';
  const lightTeal = '#e6f7f4';
  
  // Fetch assigned tasks
  useEffect(() => {
    const fetchAssignedTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const response = await fetch('/api/tasks?status=all&limit=3');
        const data = await response.json();
        
        if (data.success) {
          setAssignedTasks(data.tasks || []);
        } else {
          throw new Error(data.message || 'Failed to fetch tasks');
        }
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        setError('Unable to load your tasks');
        setAssignedTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    
    const fetchNotifications = async () => {
      setIsLoadingNotices(true);
      try {
        const response = await fetch('/api/notices?limit=2');
        const data = await response.json();
        
        if (data.success) {
          setNotifications(data.notices || []);
        } else {
          throw new Error(data.message || 'Failed to fetch notices');
        }
      } catch (err: any) {
        console.error('Error fetching notices:', err);
        // Don't set the main error, just silently fail
        setNotifications([]);
      } finally {
        setIsLoadingNotices(false);
      }
    };
    
    const fetchRecentMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const response = await fetch('/api/messages?limit=3');
        const data = await response.json();
        
        if (data.success) {
          setRecentMessages(data.messages || []);
        } else {
          console.error(data.message || 'Failed to fetch messages');
          setRecentMessages([]);
        }
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setRecentMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    const fetchRecentNotices = async () => {
      setIsLoadingNotices(true);
      try {
        const response = await fetch('/api/notices?limit=3');
        const data = await response.json();
        
        if (data.success) {
          setRecentNotices(data.notices || []);
        } else {
          console.error(data.message || 'Failed to fetch notices');
          setRecentNotices([]);
        }
      } catch (err: any) {
        console.error('Error fetching notices:', err);
        setRecentNotices([]);
      } finally {
        setIsLoadingNotices(false);
      }
    };
    
    fetchAssignedTasks();
    fetchNotifications();
    fetchRecentMessages();
    fetchRecentNotices();
  }, []);
  
  // Navigation handlers
  const handleViewTasks = () => {
    router.push('/dashboard/tasks');
  };
  
  const handleViewCalendar = () => {
    router.push('/dashboard/calendar');
  };
  
  const handleViewNotices = () => {
    router.push('/dashboard/notices');
  };
  
  const handleViewMessages = () => {
    router.push('/dashboard/messages');
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        pb: 2,
        borderBottom: `1px solid ${alpha(tealColor, 0.2)}`
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            color: orangeColor,
            fontWeight: 600,
            position: 'relative',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 60,
              height: 3,
              backgroundColor: tealColor,
              borderRadius: 1
            }
          }}
        >
          Employee Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your assigned tasks and schedule from this dashboard.
        </Typography>
      </Box>
      
      <Box sx={{ display: 'grid', gap: 3 }}>
        {/* Quick Action Buttons */}
        <Box>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: `1px solid ${alpha(tealColor, 0.1)}`,
              boxShadow: `0 4px 12px ${alpha(tealColor, 0.08)}`
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                color: '#333',
                '&:before': {
                  content: '""',
                  display: 'inline-block',
                  width: 4,
                  height: 20,
                  backgroundColor: tealColor,
                  marginRight: 1.5,
                  borderRadius: 1
                }
              }}
            >
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<AssignmentOutlined />}
                onClick={handleViewTasks}
                sx={{ 
                  py: 1.5, 
                  px: 3,
                  borderColor: orangeColor,
                  color: orangeColor,
                  '&:hover': {
                    borderColor: orangeColor,
                    backgroundColor: alpha(orangeColor, 0.08),
                  }
                }}
              >
                My Tasks
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<CalendarTodayOutlined />}
                onClick={handleViewCalendar}
                sx={{ 
                  py: 1.5, 
                  px: 3,
                  borderColor: tealColor,
                  color: tealColor,
                  '&:hover': {
                    borderColor: tealColor,
                    backgroundColor: alpha(tealColor, 0.08),
                  }
                }}
              >
                Calendar
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<NotificationsOutlined />}
                onClick={handleViewNotices}
                sx={{ 
                  py: 1.5, 
                  px: 3,
                  borderColor: orangeColor,
                  color: orangeColor,
                  '&:hover': {
                    borderColor: orangeColor,
                    backgroundColor: alpha(orangeColor, 0.08),
                  }
                }}
              >
                Notices
              </Button>
            </Box>
          </Paper>
        </Box>
        
        {/* Assigned Tasks and Notifications section */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          {/* Assigned Tasks */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              height: '100%',
              border: `1px solid ${alpha(orangeColor, 0.1)}`,
              boxShadow: `0 4px 12px ${alpha(orangeColor, 0.05)}`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: '#333',
                  '&:before': {
                    content: '""',
                    display: 'inline-block',
                    width: 4,
                    height: 20,
                    backgroundColor: orangeColor,
                    marginRight: 1.5,
                    borderRadius: 1
                  }
                }}
              >
                My Tasks
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={handleViewTasks}
                sx={{ 
                  color: orangeColor,
                  '&:hover': {
                    backgroundColor: alpha(orangeColor, 0.08),
                  }
                }}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {isLoadingTasks ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: orangeColor }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : assignedTasks.length > 0 ? (
              <List>
                {assignedTasks.map((task) => (
                  <Paper 
                    key={task._id}
                    variant="outlined"
                    sx={{ 
                      mb: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      borderColor: alpha(orangeColor, 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 4px 8px ${alpha(orangeColor, 0.15)}`,
                        borderColor: alpha(orangeColor, 0.3),
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {task.status === 'COMPLETED' ? (
                            <CheckCircleOutline sx={{ color: tealColor }} />
                          ) : task.status === 'IN_PROGRESS' ? (
                            <HourglassEmptyOutlined sx={{ color: orangeColor }} />
                          ) : (
                            <WarningOutlined sx={{ color: orangeColor }} />
                          )}
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{task.title}</Typography>
                        </Box>
                        <Chip 
                          label={task.status.replace('_', ' ')} 
                          size="small" 
                          sx={{ 
                            backgroundColor: task.status === 'COMPLETED' 
                              ? alpha(tealColor, 0.1)
                              : task.status === 'IN_PROGRESS'
                                ? alpha(orangeColor, 0.1)
                                : alpha(orangeColor, 0.1),
                            color: task.status === 'COMPLETED' ? tealColor : orangeColor,
                            fontWeight: 500
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ color: alpha('#000', 0.6) }}>
                          Due: {formatDate(task.dueDate)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(task.progressUpdates?.length || 0) > 0 ? ((task.completedDate ? 100 : 50)) : (task.status === 'COMPLETED' ? 100 : 0)} 
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: alpha(task.status === 'COMPLETED' ? tealColor : orangeColor, 0.1),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: task.status === 'COMPLETED' ? tealColor : orangeColor
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right', color: alpha('#000', 0.6) }}>
                            {task.status === 'COMPLETED' ? '100' : task.status === 'IN_PROGRESS' ? '50' : '0'}% complete
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No tasks assigned to you yet.
                </Typography>
              </Box>
            )}
          </Paper>
          
          {/* Notifications and Stats */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              height: '100%',
              border: `1px solid ${alpha(tealColor, 0.1)}`,
              boxShadow: `0 4px 12px ${alpha(tealColor, 0.05)}`
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                display: 'flex', 
                alignItems: 'center',
                color: '#333',
                '&:before': {
                  content: '""',
                  display: 'inline-block',
                  width: 4,
                  height: 20,
                  backgroundColor: tealColor,
                  marginRight: 1.5,
                  borderRadius: 1
                }
              }}
            >
              Notifications
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {isLoadingNotices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} sx={{ color: tealColor }} />
              </Box>
            ) : notifications.length > 0 ? (
              <List disablePadding>
                {notifications.map((notification) => (
                  <ListItem 
                    key={notification._id} 
                    disablePadding 
                    sx={{ 
                      mb: 1.5,
                      pb: 1.5,
                      borderBottom: `1px solid ${alpha(tealColor, 0.1)}`,
                      '&:last-of-type': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <NotificationsOutlined sx={{ color: tealColor }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={notification.title}
                      secondary={formatDate(notification.createdAt)}
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        fontWeight: 500,
                        color: '#333'
                      }}
                      secondaryTypographyProps={{ 
                        variant: 'caption',
                        color: alpha('#000', 0.6)
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No notifications at this time.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
      
      {/* Add messages and notices section below the existing content */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 4 }}>
        {/* Recent Messages Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${alpha(tealColor, 0.1)}`,
            boxShadow: `0 4px 12px ${alpha(tealColor, 0.05)}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: '#333',
                '&:before': {
                  content: '""',
                  display: 'inline-block',
                  width: 4,
                  height: 20,
                  backgroundColor: tealColor,
                  marginRight: 1.5,
                  borderRadius: 1
                }
              }}
            >
              Recent Messages
            </Typography>
            <Button 
              size="small" 
              endIcon={<ArrowForward fontSize="small" />}
              onClick={handleViewMessages}
              sx={{ 
                color: tealColor,
                '&:hover': {
                  backgroundColor: alpha(tealColor, 0.08),
                }
              }}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {isLoadingMessages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} sx={{ color: tealColor }} />
            </Box>
          ) : recentMessages.length > 0 ? (
            <List disablePadding>
              {recentMessages.map((message) => (
                <ListItem 
                  key={message._id} 
                  disablePadding 
                  sx={{ 
                    mb: 1.5,
                    pb: 1.5,
                    borderBottom: `1px solid ${alpha(tealColor, 0.1)}`,
                    cursor: 'pointer',
                    '&:last-of-type': {
                      borderBottom: 'none'
                    },
                    '&:hover': {
                      backgroundColor: alpha(tealColor, 0.05)
                    }
                  }}
                  onClick={() => router.push(`/dashboard/messages/${message._id}`)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <EmailOutlined sx={{ color: tealColor }} fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={message.subject || 'No Subject'}
                    secondary={`From: ${message.sender?.name || 'Unknown'} • ${formatDate(message.createdAt)}`}
                    primaryTypographyProps={{ 
                      variant: 'body2', 
                      fontWeight: 500,
                      color: '#333'
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'caption',
                      color: alpha('#000', 0.6)
                    }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No recent messages available
              </Typography>
            </Box>
          )}
        </Paper>
        
        {/* Recent Notices Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${alpha(orangeColor, 0.1)}`,
            boxShadow: `0 4px 12px ${alpha(orangeColor, 0.05)}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: '#333',
                '&:before': {
                  content: '""',
                  display: 'inline-block',
                  width: 4,
                  height: 20,
                  backgroundColor: orangeColor,
                  marginRight: 1.5,
                  borderRadius: 1
                }
              }}
            >
              Recent Notices
            </Typography>
            <Button 
              size="small" 
              endIcon={<ArrowForward fontSize="small" />}
              onClick={handleViewNotices}
              sx={{ 
                color: orangeColor,
                '&:hover': {
                  backgroundColor: alpha(orangeColor, 0.08),
                }
              }}
            >
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {isLoadingNotices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} sx={{ color: orangeColor }} />
            </Box>
          ) : recentNotices.length > 0 ? (
            <List disablePadding>
              {recentNotices.map((notice) => (
                <ListItem 
                  key={notice._id} 
                  disablePadding 
                  sx={{ 
                    mb: 1.5,
                    pb: 1.5,
                    borderBottom: `1px solid ${alpha(orangeColor, 0.1)}`,
                    cursor: 'pointer',
                    '&:last-of-type': {
                      borderBottom: 'none'
                    },
                    '&:hover': {
                      backgroundColor: alpha(orangeColor, 0.05)
                    }
                  }}
                  onClick={() => router.push(`/dashboard/notices/${notice._id}`)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <NotificationsOutlined sx={{ color: orangeColor }} fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={notice.title || 'Untitled Notice'}
                    secondary={`${notice.category || 'General'} • ${formatDate(notice.createdAt)}`}
                    primaryTypographyProps={{ 
                      variant: 'body2', 
                      fontWeight: 500,
                      color: '#333'
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'caption',
                      color: alpha('#000', 0.6)
                    }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No recent notices available
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
} 