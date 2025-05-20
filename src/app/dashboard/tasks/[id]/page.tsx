'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Stack,
  TextField,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack as ArrowBackIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  SwapVert as SwapVertIcon,
  ExpandMore as ExpandMoreIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formatDateHuman, formatDateTimeHuman, getTimeElapsed, isDatePast } from '@/utils/dates';
import { useAuth } from '@/contexts/AuthContext';
import { 
  format, 
  isSameDay, 
  isToday, 
  isBefore, 
  isAfter, 
  getDay, 
  parseISO, 
  addDays,
  getDaysInMonth,
  endOfMonth,
  startOfMonth,
  eachDayOfInterval,
  isSameMonth
} from 'date-fns';
import { useNotificationManager } from '@/hooks/useNotificationManager';
import { useConfetti } from '@/contexts/ConfettiContext';

// Map JS day index (0-6, Sunday-Saturday) to weekday names
const JS_DAY_TO_WEEKDAY = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

export default function TaskDetailPage({ params }: any) {
  const router = useRouter();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.up('sm'));
  const { user } = useAuth();
  const { showConfetti } = useConfetti();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressUpdate, setProgressUpdate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeRemarks, setCompleteRemarks] = useState('');
  const [completingTask, setCompletingTask] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [progressDate, setProgressDate] = useState<Date | null>(new Date());

  // State for structured updates (weekly/monthly tasks)
  const [selectedUpdateDay, setSelectedUpdateDay] = useState<Date | null>(null);
  const [dayProgressUpdates, setDayProgressUpdates] = useState<{[key: string]: string}>({});
  const [updatingDays, setUpdatingDays] = useState<{[key: string]: boolean}>({});

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayProgressDialogOpen, setDayProgressDialogOpen] = useState(false);
  const [dayProgressText, setDayProgressText] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // State for task completion revocation (for super admins)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokingCompletion, setRevokingCompletion] = useState(false);

  const { notifyNewTask } = useNotificationManager();

  // Fetch task details
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tasks/${params.id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setTask(data.task);
          
          // Check if manager is trying to access a super admin-only task
          if (user?.role === 'MANAGER' && 
              data.task.assignedBy?.role === 'SUPER_ADMIN' && 
              (Array.isArray(data.task.assignedTo) 
                ? data.task.assignedTo.every(u => u?.role === 'SUPER_ADMIN')
                : data.task.assignedTo?.role === 'SUPER_ADMIN')) {
            // Redirect to tasks page with an error message
            router.push('/dashboard/tasks?error=unauthorized');
            return;
          }
        } else {
          setError(data.message || 'Failed to fetch task details');
        }
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('An error occurred while fetching task details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTaskDetails();
    }
  }, [params.id, user, router]);

  // Handle updating task status
  const handleUpdateStatus = async () => {
    if (!newStatus) return;

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh task data
        const taskResponse = await fetch(`/api/tasks/${params.id}`);
        const taskData = await taskResponse.json();
        
        if (taskResponse.ok && taskData.success) {
          setTask(taskData.task);
          setStatusDialogOpen(false);
          setNewStatus('');
        }
      } else {
        setError(data.message || 'Failed to update task status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('An error occurred while updating task status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle adding progress update with date
  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressUpdate.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/tasks/${params.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          progress: progressUpdate,
          date: new Date().toISOString() // Always use today's date
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh task data
        const taskResponse = await fetch(`/api/tasks/${params.id}`);
        const taskData = await taskResponse.json();
        
        if (taskResponse.ok && taskData.success) {
          setTask(taskData.task);
          setProgressUpdate('');
          // Show success message
          setSnackbar({
            open: true,
            message: 'Progress update added successfully',
            severity: 'success'
          });
        }
      } else {
        setError(data.message || 'Failed to add progress update');
        setSnackbar({
          open: true,
          message: data.message || 'Failed to add progress update',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error adding progress:', err);
      setError('An error occurred while adding progress update');
      setSnackbar({
        open: true,
        message: 'An error occurred while adding progress update',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle marking task as complete
  const handleCompleteTask = async () => {
    try {
      setCompletingTask(true);
      const response = await fetch(`/api/tasks/${params.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks: completeRemarks }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh task data
        const taskResponse = await fetch(`/api/tasks/${params.id}`);
        const taskData = await taskResponse.json();
        
        if (taskResponse.ok && taskData.success) {
          setTask(taskData.task);
          setCompleteDialogOpen(false);
          setCompleteRemarks('');
          
          // Show confetti animation
          showConfetti({
            pieces: 500,
            duration: 5000
          });
          
          // Show notification for recurring task creation
          if (data.newRecurringTaskId) {
            // Add client-side notification about the new recurring task
            notifyNewTask({
              _id: data.newRecurringTaskId,
              title: task.title,
              dueDate: new Date()
            });
            
            // Show success message
            setSnackbar({
              open: true,
              message: "Task completed and new recurring task created.",
              severity: 'success'
            });
          } else {
            setSnackbar({
              open: true,
              message: "Task completed successfully.",
              severity: 'success'
            });
          }
        }
      } else {
        setError(data.message || 'Failed to mark task as complete');
      }
    } catch (err) {
      console.error('Error completing task:', err);
      setError('An error occurred while marking task as complete');
    } finally {
      setCompletingTask(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'PENDING': return 'warning';
      case 'DELAYED': return 'error';
      case 'INCOMPLETE': return 'error';
      default: return 'default';
    }
  };

  // Get task type label
  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'DAILY': return 'Daily Task';
      case 'WEEKLY': return 'Weekly Task';
      case 'MONTHLY': return 'Monthly Task';
      case 'DAILY_RECURRING': return 'Daily Recurring Task';
      case 'WEEKLY_RECURRING': return 'Weekly Recurring Task';
      case 'MONTHLY_RECURRING': return 'Monthly Recurring Task';
      default: return type;
    }
  };

  // Check if user can complete task
  const canCompleteTask = () => {
    if (!user || !task) return false;
    
    // Already completed
    if (task.status === 'COMPLETED') return false;
    
    // User is assigned to the task
    const isAssigned = Array.isArray(task.assignedTo)
      ? task.assignedTo.some(assignee => assignee?._id === user.id)
      : task.assignedTo?._id === user.id;
    
    // User is the one who assigned the task
    const isAssigner = task.assignedBy?._id === user.id;
    
    // User is admin
    const isAdmin = user.role === 'SUPER_ADMIN';
    
    return isAssigned || isAssigner || isAdmin;
  };

  // Check if user can edit task
  const canEditTask = () => {
    if (!user || !task) return false;
    
    // Already completed tasks can't be edited
    if (task.status === 'COMPLETED') return false;
    
    // User is the one who assigned the task
    const isAssigner = task.assignedBy?._id === user.id;
    
    // User is admin
    const isAdmin = user.role === 'SUPER_ADMIN';
    
    // User is manager and assigned the task
    const isManager = user.role === 'MANAGER' && isAssigner;
    
    return isAdmin || isManager;
  };

  // Check if user can delete task
  const canDeleteTask = () => {
    if (!user || !task) return false;
    
    // User is admin
    const isAdmin = user.role === 'SUPER_ADMIN';
    
    // User is manager and assigned the task
    const isManager = user.role === 'MANAGER' && task.assignedBy?._id === user.id;
    
    return isAdmin || isManager;
  };

  // Get available days for updating progress based on task type and dateRange
  const getAvailableDays = () => {
    if (!task) return [];
    
    // For daily tasks, return a date range from start to due date
    if (task.taskType === 'DAILY') {
      const startDate = new Date(task.startDate || task.createdAt);
      const endDate = new Date(task.dueDate);
      
      // If task is due in the future, only show days up to today
      const maxDate = new Date() < endDate ? new Date() : endDate;
      
      // Create array of dates between start and maxDate
      const daysBetween = eachDayOfInterval({ 
        start: startDate > new Date() ? new Date() : startDate, 
        end: maxDate 
      });
      
      return daysBetween;
    }
    
    const startDate = new Date(task.startDate || task.createdAt);
    const endDate = new Date(task.dueDate);
    let availableDays: Date[] = [];
    
    if (task.taskType === 'WEEKLY') {
      // For weekly tasks, get all days between start and end dates that match weekdays in dateRange
      const selectedWeekdays = task.dateRange?.days || [];
      if (selectedWeekdays.length === 0) {
        return [new Date()]; // Fallback to today if no days specified
      }
      
      // Limit date range to avoid too many dates
      const rangeStart = startDate > addDays(new Date(), -30) ? startDate : addDays(new Date(), -30);
      const rangeEnd = endDate < addDays(new Date(), 30) ? endDate : addDays(new Date(), 30);
      
      // Create a range of dates
      const daysBetween = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      
      // Filter only the days that match selected weekdays
      availableDays = daysBetween.filter(date => {
        const dayName = JS_DAY_TO_WEEKDAY[getDay(date)];
        return selectedWeekdays.includes(dayName);
      });
    } else if (task.taskType === 'MONTHLY') {
      // For monthly tasks
      const selectedMonthDays = task.dateRange?.days || [];
      const specificDates = task.dateRange?.specificDates?.map(d => new Date(d)) || [];
      
      if (selectedMonthDays.length === 0 && specificDates.length === 0) {
        return [new Date()]; // Fallback to today if no days specified
      }
      
      // First add all specific dates that are between start and end dates
      availableDays = specificDates.filter(date => 
        isAfter(date, startDate) && isBefore(date, endDate)
      );
      
      // Then add all month days
      if (selectedMonthDays.length > 0) {
        // Limit date range to avoid too many dates
        const rangeStart = startDate > addDays(new Date(), -60) ? startDate : addDays(new Date(), -60);
        const rangeEnd = endDate < addDays(new Date(), 60) ? endDate : addDays(new Date(), 60);
        
        // Get all months between range start and range end
        const months: { year: number, month: number }[] = [];
        const currentDate = new Date(rangeStart);
        
        while (currentDate <= rangeEnd) {
          months.push({ 
            year: currentDate.getFullYear(), 
            month: currentDate.getMonth() 
          });
          
          // Move to next month
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        // Add each day of month for each month in the range
        months.forEach(({ year, month }) => {
          selectedMonthDays.forEach(day => {
            const dayNum = parseInt(day, 10);
            if (dayNum > 0 && dayNum <= getDaysInMonth(new Date(year, month, 1))) {
              const dayDate = new Date(year, month, dayNum);
              
              // Only add if it's between start and end dates
              if (isAfter(dayDate, startDate) && isBefore(dayDate, endDate)) {
                availableDays.push(dayDate);
              }
            }
          });
        });
      }
      
      // Sort dates
      availableDays.sort((a, b) => a.getTime() - b.getTime());
    }
    
    // Remove duplicates
    return availableDays.filter((date, index, self) => 
      index === self.findIndex(d => isSameDay(d, date))
    );
  };
  
  // Check if a specific day has a progress update already
  const hasDayProgressUpdate = (day: Date) => {
    if (!task || !task.progressUpdates) return false;
    
    return task.progressUpdates.some(update => 
      isSameDay(new Date(update.date), day)
    );
  };
  
  // Get progress update for a specific day
  const getDayProgressUpdate = (day: Date) => {
    if (!task || !task.progressUpdates) return null;
    
    return task.progressUpdates.find(update => 
      isSameDay(new Date(update.date), day)
    ) || null;
  };
  
  // Handle adding progress update for a specific day
  const handleAddDayProgress = async (day: Date) => {
    // Only allow progress updates for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDay = new Date(day);
    selectedDay.setHours(0, 0, 0, 0);
    
    if (selectedDay.getTime() !== today.getTime()) {
      setSnackbar({
        open: true,
        message: 'You can only add progress updates for today',
        severity: 'error'
      });
      return;
    }
    
    setSelectedDay(day);
    setDayProgressDialogOpen(true);
  };
  
  // Determine if progress updates should be visible today
  const canAddProgressToday = () => {
    // Check if today is Sunday and the task excludes Sundays
    const today = new Date();
    const isSunday = today.getDay() === 0; // 0 is Sunday
    
    if (isSunday && task?.dateRange?.includeSundays === false) {
      return false;
    }
    
    return true;
  };
  
  // Render content for task details
  const renderTaskContent = () => {
    // Return early if we have a completed task - show the regular view
    if (task.status === 'COMPLETED') {
      return renderRegularProgress();
    }
    
    // For DAILY tasks or tasks without dateRange, show regular progress form
    if (task.taskType === 'DAILY' || !task.dateRange || 
        (task.dateRange.days?.length === 0 && 
         (!task.dateRange.specificDates || task.dateRange.specificDates.length === 0))) {
      return renderRegularProgress();
    }
    
    // For WEEKLY and MONTHLY tasks with dateRange, show structured form
    return renderStructuredProgress();
  };
  
  // Render the standard progress update form
  const renderRegularProgress = () => {
    // Check if today is Sunday and the task excludes Sundays
    const today = new Date();
    const isSunday = today.getDay() === 0; // 0 is Sunday
    const shouldHideProgressForm = isSunday && task?.dateRange?.includeSundays === false;
    
    // Check if user already added progress today
    const hasUpdatedToday = task.progressUpdates?.some(update => 
      isSameDay(new Date(update.date), new Date())
    );

    return (
      <>
        {task.status !== 'COMPLETED' && !shouldHideProgressForm && !hasUpdatedToday && (
          <Box component="form" onSubmit={handleAddProgress} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Add Today's Progress Update
            </Typography>
            
            <TextField
              label="Progress Update"
              multiline
              rows={3}
              fullWidth
              value={progressUpdate}
              onChange={(e) => setProgressUpdate(e.target.value)}
              placeholder="Describe your progress on this task..."
              sx={{ mb: 2 }}
            />
            
            <Button
              type="submit"
              variant="contained"
              startIcon={<UpdateIcon />}
              disabled={submitting || !progressUpdate.trim()}
            >
              {submitting ? 'Submitting...' : 'Add Today\'s Update'}
            </Button>
          </Box>
        )}
        
        {shouldHideProgressForm && (
          <Alert severity="info" sx={{ mb: 3 }}>
            This task is configured to exclude Sundays. Progress updates cannot be added today.
          </Alert>
        )}
        
        {hasUpdatedToday && (
          <Alert severity="success" sx={{ mb: 3 }}>
            You have already added a progress update for today.
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Display existing progress updates */}
        {task.progressUpdates && task.progressUpdates.length > 0 ? (
          <List>
            {task.progressUpdates.slice(0).reverse().map((update: any, index: number) => (
              <ListItem
                key={index}
                alignItems="flex-start"
                sx={{ 
                  bgcolor: index % 2 === 0 ? 'background.default' : 'inherit',
                  borderRadius: 1,
                  mb: 1 
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <UpdateIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      {update.updatedBy?.name || 'Unknown User'}
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        {formatDateTimeHuman(new Date(update.date))}
                      </Typography>
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mt: 1 }}
                    >
                      {update.progress}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No progress updates have been added yet.
            </Typography>
          </Box>
        )}
      </>
    );
  };
  
  // Render structured progress update form for weekly/monthly tasks
  const renderStructuredProgress = () => {
    const availableDays = getAvailableDays();
    
    // If there are too many days, group them by month
    const shouldGroupByMonth = availableDays.length > 14;
    
    if (shouldGroupByMonth) {
      // Group days by month
      const daysByMonth: Record<string, Date[]> = {};
      
      availableDays.forEach(day => {
        const monthKey = format(day, 'yyyy-MM');
        if (!daysByMonth[monthKey]) {
          daysByMonth[monthKey] = [];
        }
        daysByMonth[monthKey].push(day);
      });
      
      return (
        <>
          <Typography variant="subtitle1" gutterBottom>
            {task.taskType === 'WEEKLY' ? 'Weekly Schedule' : 'Monthly Schedule'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Progress updates should be added on the days specified when the task was created.
          </Typography>
          
          <Accordion defaultExpanded={isSameMonth(new Date(), new Date())}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Current Month: {format(new Date(), 'MMMM yyyy')}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {daysByMonth[format(new Date(), 'yyyy-MM')]?.map(day => renderDayCard(day))}
                {!daysByMonth[format(new Date(), 'yyyy-MM')] && (
                  <Typography color="text.secondary" align="center">
                    No scheduled days in current month
                  </Typography>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
          
          {Object.entries(daysByMonth)
            .filter(([monthKey]) => monthKey !== format(new Date(), 'yyyy-MM'))
            .map(([monthKey, days]) => {
              const monthDate = new Date(monthKey + '-01');
              return (
                <Accordion key={monthKey} defaultExpanded={false}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{format(monthDate, 'MMMM yyyy')}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {days.map(day => renderDayCard(day))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })}
        </>
      );
    }
    
    return (
      <>
        <Typography variant="subtitle1" gutterBottom>
          {task.taskType === 'WEEKLY' ? 'Weekly Schedule' : 'Monthly Schedule'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Progress updates should be added on the days specified when the task was created.
          {task.taskType === 'WEEKLY' 
            ? ' This task is scheduled for specific days of the week.' 
            : ' This task is scheduled for specific days of the month.'}
        </Typography>
        
        <Stack spacing={2} sx={{ mt: 2 }}>
          {availableDays.map(day => renderDayCard(day))}
          
          {availableDays.length === 0 && (
            <Alert severity="info">
              No scheduled days available in the selected range.
            </Alert>
          )}
        </Stack>
      </>
    );
  };
  
  // Render a day card for structured progress
  const renderDayCard = (day: Date) => {
    const dayNumber = day.getDate();
    const isToday = isSameDay(day, new Date());
    const hasUpdate = hasDayProgressUpdate(day);
    const update = getDayProgressUpdate(day);
    
    // Only show update button for today and if allowed
    const shouldShowUpdateButton = isToday && canAddProgressToday();
    
    return (
      <Card 
        key={day.toISOString()} 
        sx={{ 
          minHeight: 100,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          ...(isToday ? { 
            border: '2px solid',
            borderColor: 'primary.main',
          } : {}),
        }}
      >
        <Box sx={{ 
          bgcolor: isToday ? 'primary.main' : 'grey.200', 
          color: isToday ? 'white' : 'text.primary',
          p: 1,
          textAlign: 'center' 
        }}>
          <Typography variant="subtitle2">
            {format(day, 'EEE')}
          </Typography>
          <Typography variant="h6">
            {dayNumber}
          </Typography>
        </Box>
        
        <Box sx={{ p: 1, flexGrow: 1 }}>
          {hasUpdate && update ? (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Updated
              </Typography>
              <Typography variant="body2" noWrap>
                {update.progress}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {isToday ? 'No update yet' : 'No update'}
            </Typography>
          )}
        </Box>
        
        {shouldShowUpdateButton && (
          <Button
            size="small"
            onClick={() => handleAddDayProgress(day)}
            sx={{ m: 1 }}
            startIcon={<AddCircleOutlineIcon />}
            disabled={loading || hasUpdate}
          >
            {hasUpdate ? 'Updated' : 'Add Progress'}
          </Button>
        )}
      </Card>
    );
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Handle dialog close
  const handleDayProgressDialogClose = () => {
    setDayProgressDialogOpen(false);
    setDayProgressText('');
  };

  // Submit progress update for today
  const handleDayProgressSubmit = async () => {
    if (!dayProgressText.trim() || !selectedDay) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tasks/${params.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          progress: dayProgressText,
          date: selectedDay.toISOString()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh task data
        try {
          const taskResponse = await fetch(`/api/tasks/${params.id}`);
          const taskData = await taskResponse.json();
          
          if (taskResponse.ok && taskData.success) {
            setTask(taskData.task);
          }
        } catch (error) {
          console.error('Error refreshing task data:', error);
        }
        
        setSnackbar({
          open: true,
          message: 'Progress update added successfully',
          severity: 'success'
        });
        handleDayProgressDialogClose();
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to add progress update',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error adding progress:', err);
      setSnackbar({
        open: true,
        message: 'An error occurred while adding progress update',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user can send reminders
  const canSendReminder = () => {
    if (!user || !task) return false;
    
    // User is the one who assigned the task
    const isAssigner = task.assignedBy?._id === user.id;
    
    // User is admin
    const isAdmin = user.role === 'SUPER_ADMIN';
    
    // User is manager and assigned the task
    const isManager = user.role === 'MANAGER' && isAssigner;
    
    return isAdmin || isManager || isAssigner;
  };

  // Handle sending reminders
  const handleSendReminder = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tasks/${params.id}/remind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSnackbar({
          open: true,
          message: 'Reminder sent successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to send reminder',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while sending reminder',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle revoking task completion (super admin only)
  const handleRevokeCompletion = async () => {
    if (!revokeReason.trim()) return;
    
    try {
      setRevokingCompletion(true);
      
      const response = await fetch(`/api/tasks/${params.id}/revoke-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: revokeReason }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Refresh task data
        const taskResponse = await fetch(`/api/tasks/${params.id}`);
        const taskData = await taskResponse.json();
        
        if (taskResponse.ok && taskData.success) {
          setTask(taskData.task);
          setRevokeDialogOpen(false);
          setRevokeReason('');
          
          setSnackbar({
            open: true,
            message: 'Task completion has been successfully revoked',
            severity: 'success'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Failed to revoke task completion',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error revoking task completion:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred while revoking task completion',
        severity: 'error'
      });
    } finally {
      setRevokingCompletion(false);
    }
  };
  
  // Check if user can revoke task completion (super admin only)
  const canRevokeCompletion = () => {
    if (!user || !task) return false;
    
    // Only super admins can revoke task completion
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    
    // Task must be completed to revoke completion
    const isTaskCompleted = task.status === 'COMPLETED';
    
    return isSuperAdmin && isTaskCompleted;
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link}
            href="/dashboard/tasks"
          >
            Back to Tasks
          </Button>
        </Box>
      </Container>
    );
  }

  // Not found state
  if (!task) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          <AlertTitle>Task Not Found</AlertTitle>
          The requested task could not be found
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link}
            href="/dashboard/tasks"
          >
            Back to Tasks
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back button */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          href="/dashboard/tasks"
        >
          Back to Tasks
        </Button>
      </Box>

      {/* Task header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {task.title}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip 
                label={task.status} 
                color={getStatusColor(task.status) as any} 
                size="small"
              />
              <Chip 
                label={getTaskTypeLabel(task.taskType)} 
                variant="outlined" 
                size="small" 
              />
            </Stack>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Edit button */}
            {canEditTask() && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/dashboard/tasks/edit/${task._id}`)}
              >
                Edit
              </Button>
            )}
            
            {/* Complete button */}
            {canCompleteTask() && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setCompleteDialogOpen(true)}
                disabled={task.status === 'COMPLETED'}
              >
                Mark as Complete
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Task details */}
        <Box sx={{ flexGrow: 1 }}>
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {task.description}
                </Typography>
                
                {task.remarks && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Remarks:
                    </Typography>
                    <Typography variant="body2">
                      {task.remarks}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
            
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Stack spacing={2} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <PersonIcon color="primary" fontSize="small" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Assigned To
                      </Typography>
                      {Array.isArray(task.assignedTo) ? (
                        task.assignedTo.length > 0 ? (
                          <Stack spacing={0.5}>
                            {task.assignedTo.map((user, index) => (
                              <Typography key={index} variant="body2">
                                {user?.name || 'Unknown'}
                              </Typography>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2">Unassigned</Typography>
                        )
                      ) : (
                        <Typography variant="body2">
                          {task.assignedTo?.name || 'Unknown'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="info" fontSize="small" />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Assigned By
                      </Typography>
                      <Typography variant="body2">
                        {task.assignedBy?.name || task.createdBy?.name || 'System'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color={isDatePast(new Date(task.dueDate)) ? "error" : "success"} fontSize="small" />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body2">
                        {formatDateHuman(new Date(task.dueDate))}
                      </Typography>
                    </Box>
                  </Box>

                  {task.completedDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Completed On
                        </Typography>
                        <Typography variant="body2">
                          {formatDateHuman(new Date(task.completedDate))}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </Box>
      </Paper>

      {/* Task actions buttons - new section */}
      {task.status !== 'COMPLETED' && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Task Actions
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Update Status Button */}
            {canEditTask() && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<SwapVertIcon />}
                onClick={() => {
                  setNewStatus(task.status);
                  setStatusDialogOpen(true);
                }}
              >
                Update Status
              </Button>
            )}
            
            {/* Mark as Complete Button */}
            {canCompleteTask() && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setCompleteDialogOpen(true)}
              >
                Mark as Complete
              </Button>
            )}
            
            {/* Send Reminder Button */}
            {canSendReminder() && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<NotificationsIcon />}
                onClick={handleSendReminder}
                disabled={loading}
              >
                Send Reminder
              </Button>
            )}
          </Stack>
        </Paper>
      )}
      
      {/* Super Admin Actions for completed tasks */}
      {task.status === 'COMPLETED' && canRevokeCompletion() && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, borderLeft: '4px solid', borderColor: 'error.main' }}>
          <Typography variant="h6" gutterBottom color="error">
            Admin Actions
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The following actions are only available to Super Administrators and should be used with caution.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<WarningIcon />}
            onClick={() => setRevokeDialogOpen(true)}
          >
            Revoke Task Completion
          </Button>
        </Paper>
      )}

      {/* Progress updates */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Progress Updates
        </Typography>

        {/* Render task content based on task type */}
        {renderTaskContent()}
      </Paper>

      {/* Complete task dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)}>
        <DialogTitle>Mark Task as Complete</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to mark this task as complete? This action cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            label="Completion Remarks (Required)"
            fullWidth
            multiline
            rows={3}
            value={completeRemarks}
            onChange={(e) => setCompleteRemarks(e.target.value)}
            variant="outlined"
            required
            error={!completeRemarks.trim()}
            helperText={!completeRemarks.trim() ? "Please provide completion remarks" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCompleteDialogOpen(false)} 
            disabled={completingTask}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCompleteTask} 
            color="success" 
            variant="contained"
            disabled={completingTask || !completeRemarks.trim()}
          >
            {completingTask ? 'Submitting...' : 'Complete Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status update dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Task Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Change the status of this task to reflect its current state.
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="status-update-label">Status</InputLabel>
            <Select
              labelId="status-update-label"
              value={newStatus}
              label="Status"
              onChange={(e: SelectChangeEvent) => setNewStatus(e.target.value)}
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="DELAYED">Delayed</MenuItem>
              <MenuItem value="INCOMPLETE">Incomplete</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setStatusDialogOpen(false)} 
            disabled={updatingStatus}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            color="primary" 
            variant="contained"
            disabled={updatingStatus || !newStatus || newStatus === task.status}
          >
            {updatingStatus ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Day Progress Dialog */}
      <Dialog open={dayProgressDialogOpen} onClose={handleDayProgressDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Today's Progress Update
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              autoFocus
              multiline
              rows={4}
              fullWidth
              placeholder="Describe your progress for today..."
              value={dayProgressText}
              onChange={(e) => setDayProgressText(e.target.value)}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDayProgressDialogClose}>Cancel</Button>
          <Button 
            onClick={handleDayProgressSubmit}
            variant="contained"
            disabled={!dayProgressText.trim() || loading}
          >
            {loading ? 'Submitting...' : 'Submit Progress'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          elevation={6} 
          variant="filled" 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Revoke Task Completion Dialog (Super Admin Only) */}
      <Dialog 
        open={revokeDialogOpen} 
        onClose={() => setRevokeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Revoke Task Completion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <Box component="span" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
              Warning: This is an administrative action
            </Box>
            You are about to revoke the completion status of this task and set it back to "In Progress". 
            This will notify all assigned users, and they will need to complete the task again.
          </DialogContentText>
          
          <TextField
            autoFocus
            label="Reason for Revoking Completion"
            fullWidth
            multiline
            rows={3}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            variant="outlined"
            required
            error={!revokeReason.trim()}
            helperText={!revokeReason.trim() ? "Please provide a reason for revoking completion" : "This reason will be visible to all task assignees"}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRevokeDialogOpen(false)} 
            disabled={revokingCompletion}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRevokeCompletion} 
            color="error" 
            variant="contained"
            disabled={revokingCompletion || !revokeReason.trim()}
          >
            {revokingCompletion ? 'Processing...' : 'Revoke Completion'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 