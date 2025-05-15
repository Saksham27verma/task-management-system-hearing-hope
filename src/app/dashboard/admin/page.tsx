'use client';

import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Button,
  alpha,
  Container,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  NotificationsOutlined, 
  EmailOutlined,
  ArrowForward as ArrowIcon, 
  ErrorOutline as ErrorIcon,
  PeopleOutlined,
  AssignmentOutlined,
  Add as AddIcon,
  MailOutlined 
} from '@mui/icons-material';
import AdminDashboardCards from '@/components/dashboard/AdminDashboardCards';
import TaskSummaryWidget from '@/components/dashboard/TaskSummaryWidget';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  // State variables
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0
  });
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    managers: 0,
    employees: 0
  });
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  
  // Define theme colors
  const orangeColor = '#F26722';
  const tealColor = '#19ac8b';
  const lightOrange = '#FFF1E8';
  const lightTeal = '#e6f7f4';
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching admin dashboard data...');
        
        const response = await fetch('/api/dashboard/stats');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Failed to fetch dashboard data (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Dashboard data received:', data);
        
        if (data.success) {
          setTaskStats(data.taskStats);
          setUserStats(data.userStats);
        } else {
          console.error(data.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
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
      } catch (err) {
        console.error('Error fetching notices:', err);
        setRecentNotices([]);
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
      } catch (err) {
        console.error('Error fetching messages:', err);
        setRecentMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    fetchDashboardData();
    fetchRecentNotices();
    fetchRecentMessages();
  }, []);

  // Format date
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

  // Handlers
  const handleViewNotices = () => {
    router.push('/dashboard/notices');
  };

  const handleViewMessages = () => {
    router.push('/dashboard/messages');
  };

  // Add handlers for new action buttons
  const handleManageUsers = () => {
    router.push('/dashboard/users');
  };
  
  const handleAddTask = () => {
    router.push('/dashboard/tasks/create');
  };
  
  const handleAddNotice = () => {
    router.push('/dashboard/notices/create');
  };
  
  const handleComposeMessage = () => {
    router.push('/dashboard/messages/compose');
  };

  return (
    <Box sx={{ 
      maxWidth: '100%', 
      overflow: 'hidden',
      pb: 4
    }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Admin Dashboard
        </Typography>
      </Box>
      
      {/* Quick Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            color: 'text.primary',
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: '4px',
              height: '24px',
              backgroundColor: orangeColor,
              marginRight: '12px',
              borderRadius: '4px'
            }
          }}
        >
          Quick Actions
        </Typography>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${alpha(tealColor, 0.1)}`,
            boxShadow: `0 4px 12px ${alpha(tealColor, 0.05)}`
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<PeopleOutlined />}
              onClick={handleManageUsers}
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
              Manage Users
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<AssignmentOutlined />}
              onClick={handleAddTask}
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
              Add Task
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<NotificationsOutlined />}
              onClick={handleAddNotice}
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
              Add Notice
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<MailOutlined />}
              onClick={handleComposeMessage}
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
              Compose Message
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {/* Task summary widgets */}
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            color: 'text.primary',
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: '4px',
              height: '24px',
              backgroundColor: 'primary.main',
              marginRight: '12px',
              borderRadius: '4px'
            }
          }}
        >
          Task Management
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3,
          '& > *': {
            transition: 'all 0.3s ease'
          }
        }}>
          <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '300px' }}>
            <TaskSummaryWidget 
              title="My Tasks" 
              filter="assignedToMe"
            />
          </Box>
          <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '300px' }}>
            <TaskSummaryWidget 
              title="All Tasks" 
              filter=""
            />
          </Box>
          <Box sx={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '300px' }}>
            <TaskSummaryWidget 
              title="Tasks Assigned By Me" 
              filter="assignedByMe"
            />
          </Box>
        </Box>
      </Box>
      
      {/* Recent Notices and Messages Section */}
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            color: 'text.primary',
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: '4px',
              height: '24px',
              backgroundColor: tealColor,
              marginRight: '12px',
              borderRadius: '4px'
            }
          }}
        >
          Recent Communications
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 3 
        }}>
          {/* Recent Notices */}
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
                endIcon={<ArrowIcon fontSize="small" />}
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
                <CircularProgress size={30} sx={{ color: orangeColor }} />
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
                      primary={notice.title}
                      secondary={formatDate(notice.createdAt)}
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
          
          {/* Recent Messages */}
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
                endIcon={<ArrowIcon fontSize="small" />}
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
                <CircularProgress size={30} sx={{ color: tealColor }} />
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
        </Box>
      </Box>
      
      {/* Admin dashboard cards */}
      <Box sx={{ mt: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center',
            color: 'text.primary',
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: '4px',
              height: '24px',
              backgroundColor: 'primary.main',
              marginRight: '12px',
              borderRadius: '4px'
            }
          }}
        >
          Dashboard Overview
        </Typography>
        <AdminDashboardCards 
          taskStats={taskStats}
          userStats={userStats}
        />
      </Box>
    </Box>
  );
} 