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
  Alert
} from '@mui/material';
import { 
  AssignmentOutlined, 
  CalendarTodayOutlined, 
  CheckCircleOutline, 
  HourglassEmptyOutlined,
  WarningOutlined,
  ArrowForward,
  NotificationsOutlined
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
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    
    fetchAssignedTasks();
    fetchNotifications();
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
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Employee Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your assigned tasks and schedule from this dashboard.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Quick Action Buttons */}
        <Grid item xs={12} component="div">
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<AssignmentOutlined />}
                onClick={handleViewTasks}
                sx={{ py: 1.5, px: 3 }}
              >
                My Tasks
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<CalendarTodayOutlined />}
                onClick={handleViewCalendar}
                sx={{ py: 1.5, px: 3 }}
              >
                Calendar
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<NotificationsOutlined />}
                onClick={handleViewNotices}
                sx={{ py: 1.5, px: 3 }}
              >
                Notices
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Assigned Tasks */}
        <Grid item xs={12} md={8} component="div">
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">My Tasks</Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={handleViewTasks}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {isLoadingTasks ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
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
                      '&:hover': {
                        boxShadow: 1
                      }
                    }}
                    onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {task.status === 'COMPLETED' ? (
                            <CheckCircleOutline color="success" />
                          ) : task.status === 'IN_PROGRESS' ? (
                            <HourglassEmptyOutlined color="info" />
                          ) : (
                            <WarningOutlined color="warning" />
                          )}
                          <Typography variant="subtitle1">{task.title}</Typography>
                        </Box>
                        <Chip 
                          label={task.status.replace('_', ' ')} 
                          size="small" 
                          color={getStatusColor(task.status) as any}
                        />
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Due: {formatDate(task.dueDate)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(task.progressUpdates?.length || 0) > 0 ? ((task.completedDate ? 100 : 50)) : (task.status === 'COMPLETED' ? 100 : 0)} 
                            color={
                              task.status === 'COMPLETED'
                                ? 'success' 
                                : task.status === 'IN_PROGRESS'
                                  ? 'primary' 
                                  : 'warning'
                            }
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
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
        </Grid>
        
        {/* Notifications and Stats */}
        <Grid item xs={12} md={4} component="div">
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Notifications</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {isLoadingNotices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length > 0 ? (
              <List disablePadding>
                {notifications.map((notification) => (
                  <ListItem key={notification._id} disablePadding sx={{ mb: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <NotificationsOutlined color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={notification.title}
                      secondary={formatDate(notification.createdAt)}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
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
        </Grid>
      </Grid>
    </Container>
  );
} 