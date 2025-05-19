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
import TaskSummaryWidget from '@/components/dashboard/TaskSummaryWidget';
import AdminDashboardCards from '@/components/dashboard/AdminDashboardCards';

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
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
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
  
  // Theme colors
  const orangeColor = '#F26722'; // Orange color
  const tealColor = '#19ac8b'; // Teal color
  const lightOrange = '#FFF1E8';
  const lightTeal = '#e6f7f4';
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching manager dashboard data...');
        
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
    
    // Fetch recent tasks
    const fetchRecentTasks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/tasks?limit=3&sort=createdAt:desc&filterSuperAdminTasks=true');
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
    
    fetchDashboardData();
    fetchRecentTasks();
    fetchRecentMessages();
    fetchRecentNotices();
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
  
  const handleViewNotices = () => {
    router.push('/dashboard/notices');
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
          Manager Dashboard
        </Typography>
      </Box>
      
      {/* Welcome message */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your tasks and team members from this dashboard.
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
              startIcon={<AssignmentOutlined />}
              onClick={handleCreateTask}
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
              Add New Task
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
              Post Notice
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<ReportIcon />}
              onClick={handleReports}
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
              View Reports
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<EmailOutlined />}
              onClick={handleComposeMessage}
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
              Compose Message
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {/* Task Summary Cards */}
      <Box sx={{ mb: 4 }}>
        <AdminDashboardCards taskStats={taskStats} userStats={userStats} />
      </Box>
      
      {/* Task Summary Widgets */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Box>
          <TaskSummaryWidget title="Tasks Assigned To Me" filter="assignedToMe" />
        </Box>
        <Box>
          <TaskSummaryWidget title="Tasks Assigned By Me" filter="assignedByMe" />
        </Box>
      </Box>
      
      {/* Recent Information Section */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 3 
      }}>
        {/* Recent Tasks */}
        <Box sx={{ mb: { xs: 3, md: 0 } }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 4, height: 20, bgcolor: orangeColor, mr: 1.5, borderRadius: 4 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Tasks</Typography>
              </Box>
              <Button 
                endIcon={<ArrowForward />}
                onClick={handleManageTasks}
                sx={{ 
                  color: orangeColor,
                  '&:hover': { bgcolor: alpha(orangeColor, 0.08) }
                }}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={40} sx={{ color: orangeColor }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
            ) : recentTasks.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary">No recent tasks found</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {recentTasks.map((task) => (
                  <ListItem 
                    key={task._id} 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 1,
                      mb: 1,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: alpha(theme.palette.background.default, 0.6) }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 42 }}>
                      <AssignmentOutlined color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{task.title}</Typography>
                      }
                      secondary={
                        <Box component="div" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={task.status} 
                            size="small" 
                            color={getStatusColor(task.status) as any}
                            sx={{ height: 24 }}
                          />
                          <Chip 
                            label={task.priority} 
                            size="small" 
                            color={getPriorityColor(task.priority) as any}
                            sx={{ height: 24 }}
                          />
                          <Box component="div" sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            <Typography variant="caption">Due: {formatDate(task.dueDate)}</Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>
        
        {/* Recent Notices */}
        <Box>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 4, height: 20, bgcolor: tealColor, mr: 1.5, borderRadius: 4 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Notices</Typography>
              </Box>
              <Button 
                endIcon={<ArrowForward />}
                onClick={handleViewNotices}
                sx={{ 
                  color: tealColor,
                  '&:hover': { bgcolor: alpha(tealColor, 0.08) }
                }}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {isLoadingNotices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={40} sx={{ color: tealColor }} />
              </Box>
            ) : recentNotices.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary">No recent notices found</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {recentNotices.map((notice) => (
                  <ListItem 
                    key={notice._id} 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 1,
                      mb: 1,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: alpha(theme.palette.background.default, 0.6) }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 42 }}>
                      <NotificationsOutlined sx={{ color: tealColor }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{notice.title}</Typography>
                      }
                      secondary={
                        <Box component="div">
                          <Typography variant="caption" color="textSecondary">
                            Posted: {formatDate(notice.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
} 