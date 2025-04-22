'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Link
} from '@mui/material';
import {
  ArrowBackIos as PrevIcon,
  ArrowForwardIos as NextIcon,
  Event as EventIcon,
  ViewDay as ViewDayIcon,
  ViewWeek as ViewWeekIcon,
  ViewModule as ViewMonthIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Google as GoogleIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay, isSameMonth, isToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay } from 'date-fns';

// Define Task type
interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'INCOMPLETE';
  taskType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  assignedTo: {
    _id: string;
    name: string;
  };
  assignedBy: {
    _id: string;
    name: string;
  };
}

// Calendar view types
type CalendarView = 'month' | 'week' | 'agenda';

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State for calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for selected day and tasks
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [openTasksDialog, setOpenTasksDialog] = useState(false);
  
  // Google Calendar integration states
  const [openGoogleCalendarDialog, setOpenGoogleCalendarDialog] = useState(false);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    taskTypes: ['DAILY', 'WEEKLY', 'MONTHLY'],
    syncFrequency: 'daily'
  });
  const [googleAuthUrl, setGoogleAuthUrl] = useState('');
  const [googleCalendarLoading, setGoogleCalendarLoading] = useState(false);
  
  // Check URL for Google OAuth response params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    
    if (connected === 'true') {
      setGoogleCalendarConnected(true);
      // Show success message
      setError(null);
    }
    
    if (error) {
      setError(`Google Calendar connection failed: ${error}`);
    }
    
    // Clean up URL
    if (connected || error) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  
  // Check Google Calendar connection status on load
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const response = await fetch('/api/google/tokens');
        const data = await response.json();
        
        if (data.success) {
          setGoogleCalendarConnected(data.connected);
          if (data.connected && data.settings) {
            setSyncSettings(data.settings);
          }
        }
      } catch (error) {
        console.error('Error checking Google connection:', error);
      }
    };
    
    checkGoogleConnection();
  }, []);
  
  // Fetch tasks on component mount and when current date changes
  useEffect(() => {
    fetchTasks();
  }, []);
  
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate date range based on current view
      let startDate, endDate;
      
      switch (view) {
        case 'month':
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
          break;
        case 'week':
          startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
          endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
          break;
        case 'agenda':
          startDate = new Date();
          endDate = addDays(new Date(), 30);
          break;
        default:
          startDate = startOfMonth(currentDate);
          endDate = endOfMonth(currentDate);
      }
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      const response = await fetch(`/api/tasks?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
      } else {
        throw new Error(data.message || 'Failed to fetch tasks');
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setError(error.message || 'An error occurred while fetching tasks');
      
      // Mock data for development
      setTasks([
        {
          _id: '1',
          title: 'Complete monthly report',
          description: 'Prepare and submit the monthly progress report',
          dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10).toISOString(),
          status: 'PENDING',
          taskType: 'MONTHLY',
          assignedTo: {
            _id: '101',
            name: 'John Doe'
          },
          assignedBy: {
            _id: '201',
            name: 'Admin User'
          }
        },
        {
          _id: '2',
          title: 'Client meeting',
          description: 'Meeting with new potential clients',
          dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).toISOString(),
          status: 'PENDING',
          taskType: 'WEEKLY',
          assignedTo: {
            _id: '102',
            name: 'Jane Smith'
          },
          assignedBy: {
            _id: '201',
            name: 'Admin User'
          }
        },
        {
          _id: '3',
          title: 'Review team performance',
          description: 'Conduct performance reviews for team members',
          dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20).toISOString(),
          status: 'IN_PROGRESS',
          taskType: 'MONTHLY',
          assignedTo: {
            _id: '103',
            name: 'Robert Johnson'
          },
          assignedBy: {
            _id: '201',
            name: 'Admin User'
          }
        },
        {
          _id: '4',
          title: 'Website updates',
          description: 'Update company website with new content',
          dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5).toISOString(),
          status: 'COMPLETED',
          taskType: 'WEEKLY',
          assignedTo: {
            _id: '104',
            name: 'Emily Chen'
          },
          assignedBy: {
            _id: '201',
            name: 'Admin User'
          }
        },
        {
          _id: '5',
          title: 'Budget planning',
          description: 'Prepare budget proposal for next quarter',
          dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 25).toISOString(),
          status: 'PENDING',
          taskType: 'MONTHLY',
          assignedTo: {
            _id: '105',
            name: 'Michael Wilson'
          },
          assignedBy: {
            _id: '201',
            name: 'Admin User'
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate calendar
  const navigatePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'agenda':
        setCurrentDate(subDays(currentDate, 7));
        break;
    }
  };
  
  const navigateNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'agenda':
        setCurrentDate(addDays(currentDate, 7));
        break;
    }
  };
  
  const navigateToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handle view change
  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };
  
  // Get tasks for a specific day
  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };
  
  // Handle day click
  const handleDayClick = (date: Date) => {
    const tasksForDay = getTasksForDay(date);
    setSelectedDate(date);
    setSelectedDayTasks(tasksForDay);
    setOpenTasksDialog(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setOpenTasksDialog(false);
  };
  
  // Handle edit task
  const handleEditTask = (taskId: string) => {
    router.push(`/dashboard/tasks/edit/${taskId}`);
  };
  
  // Handle view task
  const handleViewTask = (taskId: string) => {
    router.push(`/dashboard/tasks/${taskId}`);
  };
  
  // Handle create task
  const handleCreateTask = () => {
    router.push('/dashboard/tasks/create');
  };
  
  // Get color for task status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4caf50';
      case 'IN_PROGRESS':
        return '#2196f3';
      case 'PENDING':
        return '#ff9800';
      case 'DELAYED':
      case 'INCOMPLETE':
        return '#f44336';
      default:
        return '#757575';
    }
  };
  
  // Format date based on view
  const formatHeaderDate = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      case 'agenda':
        return 'Upcoming Tasks';
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };
  
  // Render month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Calculate weeks for grid layout
    const weeks: Date[][] = [];
    let week: Date[] = [];
    
    days.forEach((day) => {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });
    
    return (
      <Box>
        {/* Days of week header */}
        <Grid container sx={{ borderBottom: '1px solid #e0e0e0', mb: 1 }}>
          {daysOfWeek.map(day => (
            <Grid key={day} sx={{ 
              textAlign: 'center', 
              py: 1.5, 
              fontWeight: 600,
              color: 'text.secondary',
              backgroundColor: 'grey.50',
              width: '14.28%' // 1/7 of the container
            }}>
              {day}
            </Grid>
          ))}
        </Grid>
        
        {/* Calendar weeks */}
        {weeks.map((week, weekIndex) => (
          <Grid container key={`week-${weekIndex}`} sx={{ mb: 1 }}>
            {week.map(day => {
              const tasksForDay = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayNumber = format(day, 'd');
              
              return (
                <Grid 
                  key={day.toString()} 
                  sx={{ 
                    height: '130px',
                    width: '14.28%', // 1/7 of the container
                    border: '1px solid #e0e0e0',
                    backgroundColor: isToday(day) ? 'rgba(25, 118, 210, 0.08)' : 'white',
                    opacity: isCurrentMonth ? 1 : 0.4,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      backgroundColor: isToday(day) ? 'rgba(25, 118, 210, 0.12)' : '#f8f8f8'
                    }
                  }}
                  onClick={() => handleDayClick(day)}
                >
                  {/* Day number label with badge for task count */}
                  <Box sx={{ 
                    p: 1, 
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: tasksForDay.length > 0 ? '1px dashed #e0e0e0' : 'none'
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isToday(day) ? 'bold' : 'normal',
                        color: isToday(day) ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {dayNumber}
                    </Typography>
                    
                    {tasksForDay.length > 0 && (
                      <Chip 
                        size="small" 
                        label={tasksForDay.length} 
                        color="primary" 
                        sx={{ 
                          height: '18px', 
                          minWidth: '18px',
                          fontSize: '0.65rem'
                        }} 
                      />
                    )}
                  </Box>
                  
                  {/* Task list */}
                  {tasksForDay.length > 0 && (
                    <Box 
                      sx={{ 
                        p: 0.75, 
                        overflow: 'hidden',
                        maxHeight: 'calc(100% - 30px)'
                      }}
                    >
                      {tasksForDay.slice(0, 3).map((task, index) => (
                        <Box 
                          key={task._id} 
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            backgroundColor: 'background.paper',
                            border: `1px solid ${getStatusColor(task.status)}30`,
                            borderLeft: `3px solid ${getStatusColor(task.status)}`,
                            p: 0.5,
                            borderRadius: 1,
                            mb: 0.5,
                            maxWidth: '100%',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: getStatusColor(task.status),
                              flexShrink: 0
                            }} 
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              flexGrow: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {task.title}
                          </Typography>
                        </Box>
                      ))}
                      
                      {tasksForDay.length > 3 && (
                        <Typography 
                          variant="caption" 
                          color="primary" 
                          sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
                        >
                          + {tasksForDay.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}
                </Grid>
              );
            })}
          </Grid>
        ))}
      </Box>
    );
  };
  
  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return (
      <Grid container spacing={2}>
        {days.map(day => (
          <Grid key={day.toString()} sx={{ width: '100%' }}>
            <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleDayClick(day)}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1,
                pb: 1,
                borderBottom: '1px solid #eee'
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: isToday(day) ? 'bold' : 'normal',
                    color: isToday(day) ? 'primary.main' : 'text.primary'
                  }}
                >
                  {format(day, 'EEEE')}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: isToday(day) ? 'bold' : 'normal',
                    color: isToday(day) ? 'primary.main' : 'text.secondary'
                  }}
                >
                  {format(day, 'MMM d')}
                </Typography>
              </Box>
              
              <Box>
                {getTasksForDay(day).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No tasks scheduled
                  </Typography>
                ) : (
                  getTasksForDay(day).map(task => (
                    <Box 
                      key={task._id} 
                      sx={{ 
                        display: 'flex',
                        p: 1,
                        mb: 1,
                        borderLeft: `4px solid ${getStatusColor(task.status)}`,
                        backgroundColor: '#f9f9f9',
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Assigned to: {task.assignedTo.name}
                        </Typography>
                      </Box>
                      <Chip 
                        size="small" 
                        label={task.status} 
                        sx={{ 
                          backgroundColor: getStatusColor(task.status),
                          color: 'white',
                          height: '20px'
                        }} 
                      />
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render agenda view
  const renderAgendaView = () => {
    // Group tasks by date
    const groupedTasks: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const date = format(new Date(task.dueDate), 'yyyy-MM-dd');
      if (!groupedTasks[date]) {
        groupedTasks[date] = [];
      }
      groupedTasks[date].push(task);
    });
    
    // Sort dates
    const sortedDates = Object.keys(groupedTasks).sort();
    
    return (
      <Box>
        {sortedDates.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No upcoming tasks found
          </Alert>
        ) : (
          sortedDates.map(dateStr => {
            const date = new Date(dateStr);
            const tasksForDay = groupedTasks[dateStr];
            
            return (
              <Paper key={dateStr} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box sx={{ 
                  py: 1, 
                  px: 2, 
                  backgroundColor: isToday(date) ? 'primary.main' : 'grey.100', 
                  color: isToday(date) ? 'white' : 'text.primary'
                }}>
                  <Typography variant="h6">
                    {format(date, 'EEEE, MMMM d, yyyy')}
                    {isToday(date) && ' (Today)'}
                  </Typography>
                </Box>
                
                <List sx={{ py: 0 }}>
                  {tasksForDay.map(task => (
                    <React.Fragment key={task._id}>
                      <ListItem 
                        sx={{ 
                          borderLeft: `4px solid ${getStatusColor(task.status)}`,
                          transition: 'all 0.2s',
                          '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTask(task._id);
                              }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task._id);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                        onClick={() => handleViewTask(task._id)}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>
                                {task.title}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={task.status} 
                                sx={{ 
                                  backgroundColor: getStatusColor(task.status),
                                  color: 'white',
                                  height: '20px'
                                }} 
                              />
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {task.description.substring(0, 100)}
                                {task.description.length > 100 ? '...' : ''}
                              </Typography>
                              <Typography
                                variant="caption"
                                component="div"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                Assigned to: {task.assignedTo.name} | Type: {task.taskType}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            );
          })
        )}
      </Box>
    );
  };
  
  // Google Calendar Integration Functions
  const handleGoogleCalendarConnect = async () => {
    setOpenGoogleCalendarDialog(true);
    setGoogleCalendarLoading(true);
    
    try {
      const response = await fetch('/api/google/auth');
      const data = await response.json();
      
      if (data.success) {
        setGoogleAuthUrl(data.authUrl);
      } else {
        setError('Failed to get Google authentication URL');
      }
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
      setError('Error connecting to Google Calendar');
    } finally {
      setGoogleCalendarLoading(false);
    }
  };
  
  const handleGoogleCalendarDialogClose = () => {
    setOpenGoogleCalendarDialog(false);
  };
  
  const handleTaskTypeChange = (event) => {
    setSyncSettings({
      ...syncSettings,
      taskTypes: event.target.value
    });
  };
  
  const handleSyncFrequencyChange = (event) => {
    setSyncSettings({
      ...syncSettings,
      syncFrequency: event.target.value
    });
  };
  
  const handleSaveSettings = async () => {
    try {
      setGoogleCalendarLoading(true);
      
      const response = await fetch('/api/google/tokens', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ syncSettings }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setError(null);
        // Could add a success message here
      } else {
        setError(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update Google Calendar settings');
    } finally {
      setGoogleCalendarLoading(false);
    }
  };
  
  const handleConnectToGoogle = () => {
    if (googleAuthUrl) {
      window.location.href = googleAuthUrl;
    }
  };
  
  const handleDisconnectFromGoogle = async () => {
    try {
      setGoogleCalendarLoading(true);
      
      const response = await fetch('/api/google/tokens', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setGoogleCalendarConnected(false);
        setOpenGoogleCalendarDialog(false);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to disconnect from Google Calendar');
      }
    } catch (error) {
      console.error('Error disconnecting from Google:', error);
      setError('Error disconnecting from Google Calendar');
    } finally {
      setGoogleCalendarLoading(false);
    }
  };
  
  const handleManualSync = async () => {
    try {
      setGoogleCalendarLoading(true);
      
      const response = await fetch('/api/google/sync', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setError(null);
        // Could add a success message here
      } else {
        setError(data.message || 'Failed to sync with Google Calendar');
      }
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      setError('Error syncing with Google Calendar');
    } finally {
      setGoogleCalendarLoading(false);
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Calendar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your tasks by date
        </Typography>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        {/* Calendar header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5">
              {formatHeaderDate()}
            </Typography>
            
            {/* Google Calendar indicator */}
            {googleCalendarConnected && (
              <Tooltip title="Connected to Google Calendar">
                <GoogleIcon
                  sx={{ ml: 1, color: '#4285F4', fontSize: '1.2rem' }}
                />
              </Tooltip>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ButtonGroup variant="outlined" size="small">
              <Button onClick={navigatePrevious}>
                <PrevIcon fontSize="small" />
              </Button>
              <Button onClick={navigateToday}>Today</Button>
              <Button onClick={navigateNext}>
                <NextIcon fontSize="small" />
              </Button>
            </ButtonGroup>
            
            <ButtonGroup variant="outlined" size="small">
              <Button 
                variant={view === 'month' ? 'contained' : 'outlined'} 
                onClick={() => handleViewChange('month')}
              >
                <ViewMonthIcon fontSize="small" sx={{ mr: 0.5 }} />
                Month
              </Button>
              <Button 
                variant={view === 'week' ? 'contained' : 'outlined'} 
                onClick={() => handleViewChange('week')}
              >
                <ViewWeekIcon fontSize="small" sx={{ mr: 0.5 }} />
                Week
              </Button>
              <Button 
                variant={view === 'agenda' ? 'contained' : 'outlined'} 
                onClick={() => handleViewChange('agenda')}
              >
                <ViewDayIcon fontSize="small" sx={{ mr: 0.5 }} />
                Agenda
              </Button>
            </ButtonGroup>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateTask}
            >
              Add Task
            </Button>
            
            {/* Google Calendar Integration Button */}
            <Tooltip title={googleCalendarConnected ? "Manage Google Calendar Connection" : "Connect to Google Calendar"}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleCalendarConnect}
                size="small"
              >
                {googleCalendarConnected ? "Manage Google Calendar" : "Connect Google Calendar"}
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Loading indicator */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          // Calendar views
          <Box>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'agenda' && renderAgendaView()}
          </Box>
        )}
      </Paper>
      
      {/* Tasks for selected day dialog */}
      <Dialog
        open={openTasksDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
          {selectedDate && isToday(selectedDate) && ' (Today)'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedDayTasks.length === 0 ? (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No tasks scheduled for this day
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={handleCreateTask}
              >
                Add Task
              </Button>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {selectedDayTasks.map(task => (
                <React.Fragment key={task._id}>
                  <ListItem 
                    sx={{ 
                      borderLeft: `4px solid ${getStatusColor(task.status)}`,
                      transition: 'all 0.2s',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleViewTask(task._id)}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleEditTask(task._id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>
                            {task.title}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={task.status} 
                            sx={{ 
                              backgroundColor: getStatusColor(task.status),
                              color: 'white',
                              height: '20px'
                            }} 
                          />
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" color="text.secondary" component="span">
                            {task.description}
                          </Typography>
                          <Typography
                            variant="caption"
                            component="div"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Assigned to: {task.assignedTo.name} | Type: {task.taskType}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Google Calendar Integration Dialog */}
      <Dialog
        open={openGoogleCalendarDialog}
        onClose={handleGoogleCalendarDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <GoogleIcon sx={{ mr: 1, color: '#4285F4' }} />
          Connect with Google Calendar
        </DialogTitle>
        <DialogContent dividers>
          {googleCalendarLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : googleCalendarConnected ? (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Your account is connected to Google Calendar
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom>
                Sync Settings
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="task-types-label">Task Types to Sync</InputLabel>
                <Select
                  labelId="task-types-label"
                  multiple
                  value={syncSettings.taskTypes}
                  onChange={handleTaskTypeChange}
                  label="Task Types to Sync"
                >
                  <MenuItem value="DAILY">Daily Tasks</MenuItem>
                  <MenuItem value="WEEKLY">Weekly Tasks</MenuItem>
                  <MenuItem value="MONTHLY">Monthly Tasks</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="sync-frequency-label">Sync Frequency</InputLabel>
                <Select
                  labelId="sync-frequency-label"
                  value={syncSettings.syncFrequency}
                  onChange={handleSyncFrequencyChange}
                  label="Sync Frequency"
                >
                  <MenuItem value="realtime">Real-time</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="manual">Manual only</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your tasks will be synced to your Google Calendar according to these settings.
                  You can manually sync your calendar at any time.
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="secondary" 
                  fullWidth
                  startIcon={<CalendarMonthIcon />}
                  sx={{ mb: 2 }}
                  onClick={handleManualSync}
                  disabled={googleCalendarLoading}
                >
                  Sync Now
                </Button>
                
                {/* Add save settings button */}
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  onClick={handleSaveSettings}
                  disabled={googleCalendarLoading}
                  sx={{ mb: 2 }}
                >
                  Save Settings
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth
                  onClick={handleDisconnectFromGoogle}
                  disabled={googleCalendarLoading}
                >
                  Disconnect from Google Calendar
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" paragraph>
                Connect your Hearing Hope tasks with Google Calendar to:
              </Typography>
              
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" paragraph>
                  View your tasks in your personal Google Calendar
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  Get reminders and notifications from Google Calendar
                </Typography>
                <Typography component="li" variant="body2" paragraph>
                  Access your task schedule across all your devices
                </Typography>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                You'll be redirected to Google to sign in and grant permission.
                No passwords are stored in the Hearing Hope system.
              </Alert>
              
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                startIcon={<GoogleIcon />}
                onClick={handleConnectToGoogle}
                disabled={!googleAuthUrl}
              >
                Connect to Google Calendar
              </Button>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                By connecting, you agree to Google's&nbsp;
                <Link href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
                  Terms of Service
                </Link>
                &nbsp;and&nbsp;
                <Link href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy
                </Link>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGoogleCalendarDialogClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 