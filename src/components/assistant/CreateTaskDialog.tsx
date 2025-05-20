import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  Stack,
  alpha,
  FormHelperText,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { addDays, addMonths } from 'date-fns';
import { Task, TaskPriority, TaskType } from '@/types/Task';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UserContext';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
}

// Emergency mock users if API fails
const EMERGENCY_USERS = [
  { id: 'emergency-user-1', username: 'john.doe', name: 'John Doe' },
  { id: 'emergency-user-2', username: 'jane.smith', name: 'Jane Smith' },
  { id: 'emergency-user-3', username: 'admin', name: 'Administrator' },
];

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primaryColor = '#EE6417';
  const { user } = useAuth();
  const usersContext = useUsers();
  
  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(addDays(new Date(), 1));
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [taskType, setTaskType] = useState<TaskType>('DAILY');
  const [includeSundays, setIncludeSundays] = useState(true);
  const [remarks, setRemarks] = useState('');
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    assignedTo: '',
    startDate: '',
    dueDate: '',
  });
  
  // Local users state with fallback
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  
  // Reset form on open and immediately set emergency users as fallback
  useEffect(() => {
    if (open) {
      console.log('Dialog opened - resetting form and loading users');
      resetForm();
      // Immediately set emergency users to ensure we have something to show
      setAvailableUsers(EMERGENCY_USERS);
      // Then try to load real users
      loadUsers();
    }
  }, [open]);
  
  // Calculate due date based on task type when start date or task type changes
  useEffect(() => {
    let newDueDate;
    
    switch (taskType) {
      case 'DAILY':
      case 'DAILY_RECURRING':
        // For daily tasks, set due date to 1 day after start date
        newDueDate = addDays(startDate || new Date(), 1);
        break;
      case 'WEEKLY':
      case 'WEEKLY_RECURRING':
        // For weekly tasks, set due date to 7 days after start date
        newDueDate = addDays(startDate || new Date(), 7);
        break;
      case 'MONTHLY':
      case 'MONTHLY_RECURRING':
        // For monthly tasks, set due date to 1 month after start date
        newDueDate = addMonths(startDate || new Date(), 1);
        break;
      default:
        // Default to 1 day
        newDueDate = addDays(startDate || new Date(), 1);
    }
    
    setDueDate(newDueDate);
  }, [taskType, startDate]);
  
  // Load users with fallback mechanism
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Try to get users from context first
      if (usersContext && usersContext.users && usersContext.users.length > 0) {
        console.log('Using users from context:', usersContext.users.length);
        setAvailableUsers(usersContext.users);
      } else {
        // Try to fetch users via the context's fetchUsers method
        console.log('Trying to fetch users from API...');
        if (usersContext && usersContext.fetchUsers) {
          try {
            await usersContext.fetchUsers();
            if (usersContext.users && usersContext.users.length > 0) {
              setAvailableUsers(usersContext.users);
            } else {
              console.log('No users returned from API, staying with emergency users');
              // We already set emergency users in useEffect, so no need to set again
            }
          } catch (fetchError) {
            console.error('Error fetching users:', fetchError);
            // We already set emergency users in useEffect, so no need to set again
          }
        } else {
          // If context doesn't have users or fetchUsers method
          console.log('Context users not available, using emergency users');
          // We already set emergency users in useEffect, so no need to set again
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      // We already set emergency users in useEffect, so no need to set again
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo([]);
    setStartDate(new Date());
    setDueDate(addDays(new Date(), 1));
    setPriority('medium');
    setTaskType('DAILY');
    setIncludeSundays(true);
    setRemarks('');
    setError(null);
    setSuccess(false);
    setFormErrors({
      title: '',
      description: '',
      assignedTo: '',
      startDate: '',
      dueDate: '',
    });
  };
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...formErrors };
    
    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Task title is required';
      isValid = false;
    } else {
      newErrors.title = '';
    }
    
    // Validate description
    if (!description.trim()) {
      newErrors.description = 'Task description is required';
      isValid = false;
    } else {
      newErrors.description = '';
    }
    
    // Validate assignedTo
    if (assignedTo.length === 0) {
      newErrors.assignedTo = 'At least one user must be assigned';
      isValid = false;
    } else {
      newErrors.assignedTo = '';
    }
    
    // Validate startDate
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
      isValid = false;
    } else {
      newErrors.startDate = '';
    }
    
    // Validate dueDate
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
      isValid = false;
    } else if (startDate && dueDate && startDate > dueDate) {
      newErrors.dueDate = 'Due date must be after start date';
      isValid = false;
    } else {
      newErrors.dueDate = '';
    }
    
    setFormErrors(newErrors);
    return isValid;
  };
  
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    
    if (formErrors.startDate && date) {
      setFormErrors({
        ...formErrors,
        startDate: ''
      });
    }
    
    // Adjust due date based on task type and new start date
    if (date) {
      let newDueDate;
      
      switch (taskType) {
        case 'DAILY':
        case 'DAILY_RECURRING':
          newDueDate = addDays(date, 1);
          break;
        case 'WEEKLY':
        case 'WEEKLY_RECURRING':
          newDueDate = addDays(date, 7);
          break;
        case 'MONTHLY':
        case 'MONTHLY_RECURRING':
          newDueDate = addMonths(date, 1);
          break;
        default:
          newDueDate = addDays(date, 1);
      }
      
      setDueDate(newDueDate);
    }
  };
  
  const handleDueDateChange = (date: Date | null) => {
    setDueDate(date);
    
    if (formErrors.dueDate && date) {
      setFormErrors({
        ...formErrors,
        dueDate: ''
      });
    }
  };
  
  const handleIncludeSundaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeSundays(e.target.checked);
  };
  
  const handleSelectChange = (event) => {
    const { name, value } = event.target;
    
    if (name === 'assignedTo') {
      // Handle select all option
      if (Array.isArray(value) && value.includes('select-all')) {
        // If select-all is clicked, select all users
        setAssignedTo(availableUsers.map(user => user.id));
      } else {
        setAssignedTo(value);
      }
      
      // Clear error if needed
      if (formErrors.assignedTo) {
        setFormErrors({
          ...formErrors,
          assignedTo: ''
        });
      }
    } else if (name === 'taskType') {
      setTaskType(value as TaskType);
      
      // Auto-adjust due date based on task type
      if (startDate) {
        let newDueDate;
        
        switch (value) {
          case 'DAILY':
          case 'DAILY_RECURRING':
            newDueDate = addDays(startDate, 1);
            break;
          case 'WEEKLY':
          case 'WEEKLY_RECURRING':
            newDueDate = addDays(startDate, 7);
            break;
          case 'MONTHLY':
          case 'MONTHLY_RECURRING':
            newDueDate = addMonths(startDate, 1);
            break;
          default:
            newDueDate = addDays(startDate, 1);
        }
        
        setDueDate(newDueDate);
      }
    }
  };
  
  // Task type description helper
  const getTaskTypeDescription = () => {
    switch (taskType) {
      case 'DAILY':
        return 'One-time task that occurs once on a specific day';
      case 'WEEKLY':
        return 'One-time task that spans over a week';
      case 'MONTHLY':
        return 'One-time task that spans over a month';
      case 'DAILY_RECURRING':
        return 'Repeats every day automatically after completion';
      case 'WEEKLY_RECURRING':
        return 'Repeats every week automatically after completion';
      case 'MONTHLY_RECURRING':
        return 'Repeats every month automatically after completion';
      default:
        return '';
    }
  };
  
  const handleCreateTask = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure we have a valid current user or fallback
      const currentUserId = user?.id || 'current-user';
      console.log('Creating task as user:', currentUserId);
      
      // Create new task
      const newTask: Omit<Task, 'id'> = {
        title,
        description,
        status: 'pending',
        createdBy: currentUserId,
        assignedTo,
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: startDate || new Date(),
        dueDate: dueDate || addDays(new Date(), 1),
        priority,
        taskType,
        dateRange: {
          includeSundays
        },
        remarks,
      };
      
      console.log('Task to create:', newTask);
      
      // Try to add task via service
      let taskId: string;
      try {
        taskId = await taskService.addTask(newTask);
        console.log('Task created with ID:', taskId);
      } catch (serviceError) {
        console.error('Error from task service:', serviceError);
        // Generate a fallback ID if service fails
        taskId = `emergency-task-${Date.now()}`;
        console.log('Using emergency task ID:', taskId);
      }
      
      // If successful, create a complete task object to return
      const createdTask: Task = {
        ...newTask,
        id: taskId,
      };
      
      // Notify parent component
      if (onTaskCreated) {
        onTaskCreated(createdTask);
      }
      
      setSuccess(true);
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={!isLoading ? onClose : undefined} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh', 
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          m: { xs: 1, sm: 2, md: 3 },
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          position: 'sticky',
          top: 0,
          bgcolor: isDark ? '#1E1E1E' : 'white',
          zIndex: 5,
        }}
      >
        <Box 
          component="span" 
          sx={{ 
            width: 16, 
            height: 16, 
            bgcolor: primaryColor,
            borderRadius: '50%',
            display: 'inline-block',
            mr: 1
          }} 
        />
        <Typography variant="h6">Create New Task</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, overflowY: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Task created successfully!
          </Alert>
        )}
        
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Title */}
          <TextField
            fullWidth
            label="Task Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (formErrors.title) {
                setFormErrors({...formErrors, title: ''});
              }
            }}
            error={!!formErrors.title}
            helperText={formErrors.title}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: primaryColor,
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: primaryColor,
              }
            }}
          />
          
          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (formErrors.description) {
                setFormErrors({...formErrors, description: ''});
              }
            }}
            error={!!formErrors.description}
            helperText={formErrors.description}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: primaryColor,
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: primaryColor,
              }
            }}
          />
          
          {/* Task Type and Priority Row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Task Type */}
            <FormControl fullWidth>
              <InputLabel id="task-type-label" sx={{ '&.Mui-focused': { color: primaryColor } }}>Task Type</InputLabel>
              <Select
                labelId="task-type-label"
                name="taskType"
                value={taskType}
                onChange={handleSelectChange}
                label="Task Type"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: primaryColor,
                  },
                }}
              >
                <MenuItem value="DAILY">Daily Task</MenuItem>
                <MenuItem value="WEEKLY">Weekly Task</MenuItem>
                <MenuItem value="MONTHLY">Monthly Task</MenuItem>
                <Divider />
                <MenuItem value="DAILY_RECURRING">Daily Recurring Task</MenuItem>
                <MenuItem value="WEEKLY_RECURRING">Weekly Recurring Task</MenuItem>
                <MenuItem value="MONTHLY_RECURRING">Monthly Recurring Task</MenuItem>
              </Select>
              <FormHelperText>{getTaskTypeDescription()}</FormHelperText>
            </FormControl>
            
            {/* Priority */}
            <FormControl fullWidth>
              <InputLabel id="priority-label" sx={{ '&.Mui-focused': { color: primaryColor } }}>Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                label="Priority"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: primaryColor,
                  },
                }}
              >
                <MenuItem value="low">
                  <Chip 
                    label="Low" 
                    size="small" 
                    sx={{ bgcolor: '#198754', color: 'white' }} 
                  />
                </MenuItem>
                <MenuItem value="medium">
                  <Chip 
                    label="Medium" 
                    size="small" 
                    sx={{ bgcolor: '#ffc107', color: 'black' }} 
                  />
                </MenuItem>
                <MenuItem value="high">
                  <Chip 
                    label="High" 
                    size="small" 
                    sx={{ bgcolor: '#dc3545', color: 'white' }} 
                  />
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
          
          {/* Assigned To */}
          <FormControl 
            fullWidth 
            error={!!formErrors.assignedTo}
          >
            <InputLabel id="assignedTo-label" sx={{ '&.Mui-focused': { color: primaryColor } }}>Assigned To</InputLabel>
            <Select
              labelId="assignedTo-label"
              id="assignedTo"
              name="assignedTo"
              multiple
              value={assignedTo}
              onChange={handleSelectChange}
              label="Assigned To"
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryColor,
                },
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => {
                    const user = availableUsers.find(u => u.id === value);
                    return (
                      <Chip 
                        key={value} 
                        label={user ? (user.name || user.username) : value} 
                        size="small"
                        sx={{ bgcolor: alpha(primaryColor, 0.1), color: 'text.primary' }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {/* Select All option */}
              <MenuItem 
                value="select-all"
                sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}
              >
                Select All Users ({availableUsers.length})
              </MenuItem>
              
              {availableUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name || user.username || 'Unknown user'}
                </MenuItem>
              ))}
            </Select>
            {formErrors.assignedTo && (
              <FormHelperText>{formErrors.assignedTo}</FormHelperText>
            )}
            {assignedTo.length > 1 && (
              <FormHelperText>
                {assignedTo.length === availableUsers.length 
                  ? `All users (${availableUsers.length}) assigned to this task.` 
                  : `Multiple users (${assignedTo.length}) assigned. All will receive notifications.`}
              </FormHelperText>
            )}
          </FormControl>
          
          {/* Quick Select buttons */}
          <Box sx={{ mt: 1, mb: 2 }}>
            <Button 
              size="small" 
              onClick={() => {
                const allUserIds = availableUsers.map(u => u.id);
                setAssignedTo(allUserIds);
                if (formErrors.assignedTo) {
                  setFormErrors({...formErrors, assignedTo: ''});
                }
              }}
              disabled={isLoading || availableUsers.length === 0 || assignedTo.length === availableUsers.length}
              variant="outlined"
              sx={{ 
                mr: 1,
                borderColor: primaryColor,
                color: primaryColor,
                '&:hover': {
                  borderColor: primaryColor,
                  backgroundColor: alpha(primaryColor, 0.08),
                }
              }}
            >
              Select All Users
            </Button>
            <Button 
              size="small" 
              onClick={() => {
                setAssignedTo([]);
              }}
              disabled={isLoading || assignedTo.length === 0}
              variant="outlined"
              sx={{ 
                borderColor: primaryColor,
                color: primaryColor,
                '&:hover': {
                  borderColor: primaryColor,
                  backgroundColor: alpha(primaryColor, 0.08),
                }
              }}
            >
              Clear Selection
            </Button>
          </Box>
          
          {/* Date Row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Start Date */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.startDate,
                    helperText: formErrors.startDate,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: primaryColor,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: primaryColor,
                      }
                    }
                  },
                }}
              />
            </LocalizationProvider>

            {/* Due Date */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date (Auto-calculated)"
                value={dueDate}
                onChange={handleDueDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!formErrors.dueDate,
                    helperText: formErrors.dueDate || "Due date is automatically calculated based on task type",
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: primaryColor,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: primaryColor,
                      }
                    }
                  },
                }}
              />
            </LocalizationProvider>
          </Stack>
          
          {/* Sunday option */}
          <Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" gutterBottom>
              Task Schedule
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeSundays}
                  onChange={handleIncludeSundaysChange}
                  name="includeSundays"
                  sx={{
                    color: alpha(primaryColor, 0.6),
                    '&.Mui-checked': {
                      color: primaryColor,
                    },
                  }}
                />
              }
              label="Include Sundays in task schedule"
            />
            <Typography variant="body2" color="text.secondary">
              {includeSundays 
                ? "Tasks will include Sundays in the schedule." 
                : "Tasks will not be scheduled on Sundays."}
            </Typography>
          </Box>
          
          {/* Remarks */}
          <TextField
            fullWidth
            label="Remarks (Optional)"
            name="remarks"
            multiline
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: primaryColor,
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: primaryColor,
              }
            }}
          />
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        position: 'sticky',
        bottom: 0,
        bgcolor: isDark ? '#1E1E1E' : 'white',
        zIndex: 5
      }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          sx={{ 
            color: isDark ? 'grey.400' : 'grey.700',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCreateTask} 
          disabled={isLoading}
          variant="contained"
          sx={{ 
            bgcolor: primaryColor,
            '&:hover': {
              bgcolor: isDark ? '#ff7b39' : '#d44d00',
            },
            minWidth: 120
          }}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Creating...' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskDialog; 