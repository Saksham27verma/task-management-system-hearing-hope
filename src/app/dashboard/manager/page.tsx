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
  CircularProgress
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
  AssessmentOutlined as ReportIcon
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  
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
    
    fetchRecentTasks();
  }, []);
  
  const handleCreateTask = () => {
    router.push('/dashboard/tasks/create');
  };
  
  const handleManageTasks = () => {
    router.push('/dashboard/tasks');
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
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manager Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your tasks and team members from this dashboard.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Quick Action Buttons */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<AssignmentOutlined />}
                  onClick={handleCreateTask}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Create Task
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<PeopleOutlined />}
                  onClick={handleManageTasks}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Manage Tasks
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<NotificationsOutlined />}
                  onClick={handleCreateNotice}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  View Notices
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<CalendarTodayOutlined />}
                  onClick={handleViewCalendar}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  View Calendar
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<ReportIcon />}
                  onClick={handleViewReports}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  View Reports
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Recent Tasks Section */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Tasks</Typography>
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                onClick={handleManageTasks}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
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
                      bgcolor: 'background.default',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                  >
                    <ListItemIcon>
                      {task.status === 'COMPLETED' ? (
                        <CheckCircleOutline color="success" />
                      ) : task.status === 'IN_PROGRESS' ? (
                        <HourglassEmptyOutlined color="info" />
                      ) : (
                        <WarningOutlined color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={task.title}
                      secondary={`Due: ${formatDate(task.dueDate)}`}
                    />
                    <Chip 
                      label={task.status} 
                      size="small" 
                      color={getStatusColor(task.status) as any}
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
        </Grid>
        
        {/* Task Summary Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Task Summary</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pending Tasks
                  </Typography>
                  <Typography variant="h4" color="warning.main" sx={{ mt: 1 }}>
                    5
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    In Progress
                  </Typography>
                  <Typography variant="h4" color="info.main" sx={{ mt: 1 }}>
                    3
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Completed Tasks
                  </Typography>
                  <Typography variant="h4" color="success.main" sx={{ mt: 1 }}>
                    12
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 