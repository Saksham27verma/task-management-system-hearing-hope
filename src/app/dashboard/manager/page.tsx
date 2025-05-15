'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import { 
  AssignmentOutlined, 
  PeopleOutlined, 
  NotificationsOutlined, 
  CalendarTodayOutlined, 
  CheckCircleOutline, 
  HourglassEmptyOutlined,
  WarningOutlined,
  ArrowForward,
  Add as AddIcon,
  AssessmentOutlined as ReportIcon,
  EmailOutlined
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

export default function ManagerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  
  // Theme colors
  const orangeColor = '#F26722'; // Orange color
  const tealColor = '#19ac8b'; // Teal color
  const lightOrange = '#FFF1E8';
  const lightTeal = '#e6f7f4';
  
  // Fetch recent tasks
  useEffect(() => {
    const fetchRecentTasks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/tasks?limit=3&sort=createdAt:desc');
        const data = await response.json();
        
        if (data.success) {
          setRecentTasks(data.tasks || []);
        } else {
          throw new Error(data.message || 'Failed to fetch recent tasks');
        }
      } catch (err: any) {
        console.error('Error fetching recent tasks:', err);
        setError('Unable to load recent tasks');
        setRecentTasks([]);
      } finally {
        setIsLoading(false);
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
    
    fetchRecentTasks();
    fetchRecentMessages();
  }, []);
  
  const handleCreateTask = () => {
    router.push('/dashboard/tasks/create');
  };
  
  const handleManageTasks = () => {
    router.push('/dashboard/tasks');
  };
  
  const handleReports = () => {
    router.push('/dashboard/reports');
  };
  
  const handleViewMessages = () => {
    router.push('/dashboard/messages');
  };
  
  const handleCreateNotice = () => {
    router.push('/dashboard/notices/create');
  };
  
  const handleViewCalendar = () => {
    router.push('/dashboard/calendar');
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
          Manager Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your tasks and team members from this dashboard.
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
                onClick={handleCreateTask}
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
                Create Task
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<PeopleOutlined />}
                onClick={handleManageTasks}
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
                Manage Tasks
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<NotificationsOutlined />}
                onClick={handleCreateNotice}
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
                View Notices
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
                View Calendar
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ReportIcon />}
                onClick={handleReports}
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
                View Reports
              </Button>
            </Box>
          </Paper>
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          {/* Recent Tasks Section */}
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
                Recent Tasks
              </Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={handleManageTasks}
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
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: orangeColor }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : recentTasks.length > 0 ? (
              <List>
                {recentTasks.map((task) => (
                  <ListItem 
                    key={task._id}
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      mb: 1, 
                      borderRadius: 1,
                      border: `1px solid ${alpha(orangeColor, 0.1)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(orangeColor, 0.05),
                        boxShadow: `0 2px 8px ${alpha(orangeColor, 0.1)}`,
                        transform: 'translateY(-2px)'
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                  >
                    <ListItemIcon>
                      {task.status === 'COMPLETED' ? (
                        <CheckCircleOutline sx={{ color: tealColor }} />
                      ) : task.status === 'IN_PROGRESS' ? (
                        <HourglassEmptyOutlined sx={{ color: orangeColor }} />
                      ) : (
                        <WarningOutlined sx={{ color: orangeColor }} />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={task.title}
                      secondary={`Due: ${formatDate(task.dueDate)}`}
                      primaryTypographyProps={{
                        fontWeight: 500,
                        color: '#333'
                      }}
                      secondaryTypographyProps={{
                        color: alpha('#000', 0.6)
                      }}
                    />
                    <Chip 
                      label={task.status} 
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
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No recent tasks to display
              </Typography>
            )}
          </Paper>
          
          {/* Replace Task Summary Card with Recent Messages */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Recent Messages Card */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 2, 
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
                Recent Messages
              </Typography>
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
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
                  View All Messages
                </Button>
              </Box>
            </Paper>
            
            {/* Task Summary Card */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 2, 
                border: `1px solid ${alpha(orangeColor, 0.1)}`,
                boxShadow: `0 4px 12px ${alpha(orangeColor, 0.05)}`
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
                    backgroundColor: orangeColor,
                    marginRight: 1.5,
                    borderRadius: 1
                  }
                }}
              >
                Task Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderColor: alpha(orangeColor, 0.2),
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      borderColor: orangeColor,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 8px ${alpha(orangeColor, 0.1)}`
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Pending Tasks
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, color: orangeColor }}>
                      5
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderColor: alpha(orangeColor, 0.2),
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      borderColor: orangeColor,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 8px ${alpha(orangeColor, 0.1)}`
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      In Progress
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, color: orangeColor }}>
                      3
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderColor: alpha(tealColor, 0.2),
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      borderColor: tealColor,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 8px ${alpha(tealColor, 0.1)}`
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Completed Tasks
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, color: tealColor }}>
                      12
                    </Typography>
                  </CardContent>
                </Card>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateTask}
                  sx={{ 
                    mt: 1,
                    bgcolor: tealColor,
                    '&:hover': {
                      bgcolor: alpha(tealColor, 0.9),
                    }
                  }}
                >
                  Create New Task
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
      
      {/* Add another section for notices */}
      <Box sx={{ mt: 4 }}>
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
              Recent Notices
            </Typography>
            <Button 
              size="small" 
              endIcon={<ArrowForward fontSize="small" />}
              onClick={handleCreateNotice}
              sx={{ 
                color: tealColor,
                '&:hover': {
                  backgroundColor: alpha(tealColor, 0.08),
                }
              }}
            >
              Manage Notices
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Stay informed with company-wide announcements and updates
            </Typography>
            <Button
              variant="outlined"
              onClick={handleCreateNotice}
              sx={{ 
                borderColor: tealColor,
                color: tealColor,
                '&:hover': {
                  borderColor: tealColor,
                  backgroundColor: alpha(tealColor, 0.08),
                }
              }}
            >
              Create New Notice
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 