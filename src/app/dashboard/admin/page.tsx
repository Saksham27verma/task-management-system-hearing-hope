'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  AssignmentOutlined as TaskIcon,
  PeopleOutlined as PeopleIcon,
  NotificationsOutlined as NotificationIcon,
  WarningAmber as WarningIcon,
  CheckCircleOutline as CompletedIcon,
  Timelapse as PendingIcon,
  ScheduleOutlined as ScheduleIcon,
  HourglassEmpty as InProgressIcon,
  Event as EventIcon,
  Group as UserIcon,
  Announcement as NoticeIcon,
  AssessmentOutlined as ReportIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Helper function for priority color
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return '#e74a3b';
    case 'medium':
      return '#f6c23e';
    case 'low':
      return '#4e73df';
    default:
      return '#858796';
  }
};

// Helper function for status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#1cc88a';
    case 'IN_PROGRESS':
      return '#4e73df';
    case 'PENDING':
      return '#f6c23e';
    case 'DELAYED':
    case 'INCOMPLETE':
      return '#e74a3b';
    default:
      return '#858796';
  }
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
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
          setUpcomingTasks(data.upcomingTasks || []);
          setRecentNotices(data.recentNotices || []);
        } else {
          throw new Error(data.message || 'Failed to load dashboard data');
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'An error occurred while loading dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Navigation handlers
  const handleCreateTask = () => {
    router.push('/dashboard/tasks/create');
  };
  
  const handleManageUsers = () => {
    router.push('/dashboard/users');
  };
  
  const handleCreateNotice = () => {
    router.push('/dashboard/notices');
  };
  
  const handleViewCalendar = () => {
    router.push('/dashboard/calendar');
  };

  const handleViewReports = () => {
    router.push('/dashboard/reports');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This could be due to permission issues or the server may be unavailable. Please ensure you have admin permissions.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of the current tasks and team status
        </Typography>
      </Box>

      {/* Quick action buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box sx={{ flexBasis: { xs: '100%', sm: 'auto' } }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<TaskIcon />}
            onClick={handleCreateTask}
          >
            Create Task
          </Button>
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '45%', md: '22%' } }}>
          <Button 
            variant="contained" 
            startIcon={<UserIcon />}
            onClick={handleManageUsers}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Manage Users
          </Button>
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '45%', md: '22%' } }}>
          <Button 
            variant="contained" 
            startIcon={<NoticeIcon />}
            onClick={handleCreateNotice}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Post Notice
          </Button>
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '45%', md: '22%' } }}>
          <Button 
            variant="contained" 
            startIcon={<EventIcon />}
            onClick={handleViewCalendar}
            fullWidth
            sx={{ py: 1.5 }}
          >
            View Calendar
          </Button>
        </Box>
        <Box sx={{ flexBasis: { xs: '100%', sm: '45%', md: '22%' } }}>
          <Button 
            variant="contained" 
            startIcon={<ReportIcon />}
            onClick={handleViewReports}
            fullWidth
            sx={{ py: 1.5 }}
          >
            View Reports
          </Button>
        </Box>
      </Box>

      {/* Dashboard widgets */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Task summary widget */}
        <Box sx={{ flexBasis: { xs: '100%', md: '50%' }, p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TaskIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Task Summary</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItem>
              <ListItemText primary="Total Tasks" secondary={taskStats.total} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Completed Tasks" secondary={taskStats.completed} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Pending Tasks" secondary={taskStats.pending} />
            </ListItem>
            <ListItem>
              <ListItemText primary="In Progress Tasks" secondary={taskStats.inProgress} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Overdue Tasks" secondary={taskStats.overdue} />
            </ListItem>
          </List>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button color="primary" onClick={() => router.push('/dashboard/tasks')}>
              View All Tasks
            </Button>
          </Box>
        </Box>

        {/* Employee summary widget */}
        <Box sx={{ flexBasis: { xs: '100%', md: '50%' }, p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PeopleIcon color="secondary" sx={{ mr: 1 }} />
            <Typography variant="h6">Employee Summary</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            <ListItem>
              <ListItemText primary="Total Employees" secondary={userStats.total} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Active Employees" secondary={userStats.active} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Managers" secondary={userStats.managers} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Employees" secondary={userStats.employees} />
            </ListItem>
          </List>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button color="secondary" onClick={() => router.push('/dashboard/directory')}>
              View Directory
            </Button>
          </Box>
        </Box>

        {/* Upcoming tasks widget */}
        <Box sx={{ flexBasis: { xs: '100%', md: '66%' }, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScheduleIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Upcoming Tasks</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <React.Fragment key={task._id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{ px: 1, cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getStatusColor(task.status),
                        }}
                      >
                        {task.status === 'COMPLETED' ? (
                          <CompletedIcon />
                        ) : task.status === 'IN_PROGRESS' ? (
                          <InProgressIcon />
                        ) : (
                          <PendingIcon />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {task.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={task.status}
                            sx={{
                              ml: 1,
                              bgcolor: getStatusColor(task.status),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {`Assigned to: ${task.assignedTo?.name || 'Unknown'}`}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            {`Due: ${formatDate(task.dueDate)}`}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No upcoming tasks found
                </Typography>
              </Box>
            )}
          </List>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button color="primary" onClick={() => router.push('/dashboard/tasks')}>
              View All Tasks
            </Button>
          </Box>
        </Box>

        {/* Recent notices widget */}
        <Box sx={{ flexBasis: { xs: '100%', md: '33%' }, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotificationIcon color="secondary" sx={{ mr: 1 }} />
            <Typography variant="h6">Recent Notices</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {recentNotices.length > 0 ? (
              recentNotices.map((notice) => (
                <React.Fragment key={notice._id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{ px: 1, cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/notices/${notice._id}`)}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          {notice.title}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {`Posted by: ${notice.postedBy?.name || 'Unknown'}`}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            {`Date: ${formatDate(notice.createdAt)}`}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))
            ) : (
              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No recent notices found
                </Typography>
              </Box>
            )}
          </List>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button color="secondary" onClick={() => router.push('/dashboard/notices')}>
              View All Notices
            </Button>
          </Box>
        </Box>
      </Box>

      {/* System Maintenance section */}
      <Box sx={{ my: 4, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.03)', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          System Maintenance
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Permission System
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  If users are experiencing permission issues, you can fix all permissions system-wide.
                </Typography>
                <Button 
                  variant="contained" 
                  color="warning" 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to fix permissions for all users? This will reset permissions to their role defaults.')) {
                      try {
                        const response = await fetch('/api/system/fix-permissions');
                        const data = await response.json();
                        if (data.success) {
                          alert(`Permissions fixed for ${data.count} users. The page will reload.`);
                          window.location.reload();
                        } else {
                          alert('Error fixing permissions: ' + data.message);
                        }
                      } catch (error) {
                        console.error('Error fixing permissions:', error);
                        alert('Error fixing permissions. Check console for details.');
                      }
                    }
                  }}
                >
                  Fix All Permissions
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 