'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  CircularProgress,
  Grid,
  Paper,
  Alert,
  Stack,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Chip,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format, addMonths, setHours, setMinutes } from 'date-fns';
import { TaskStatus, TaskType } from '@/models/Task';
import { useAuth } from '@/contexts/AuthContext';

// Define user interface
interface User {
  _id: string;
  name: string;
}

// Define props interface
interface TaskFormProps {
  task?: {
    _id?: string;
    title: string;
    description: string;
    assignedTo: string | string[];
    taskType: TaskType;
    status: TaskStatus;
    startDate?: string | Date;
    dueDate: string | Date;
    dateRange?: {
      includeSundays?: boolean;
    };
    remarks?: string;
  };
  onSubmit: (success: boolean) => void;
  onCancel: () => void;
}

// Days of the week for weekly tasks
const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

// Generate days of month 1-31
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const theme = useTheme();
  const primaryColor = '#F26722'; // Orange color
  
  // Convert assignedTo to array if it's a string (for backwards compatibility)
  const initialAssignedTo = task?.assignedTo
    ? Array.isArray(task.assignedTo)
      ? task.assignedTo
      : [task.assignedTo]
    : [];

  // Get initial due date and time from task if it exists
  const initialDueDate = task?.dueDate ? new Date(task.dueDate) : addDays(new Date(), 1);
  
  // Default formData state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    assignedTo: string[];
    taskType: TaskType;
    status: TaskStatus;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    startDate: Date;
    dueDate: Date;
    remarks: string;
  }>({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: initialAssignedTo,
    taskType: task?.taskType || 'DAILY',
    status: task?.status || 'PENDING',
    priority: 'MEDIUM',
    startDate: task?.startDate ? new Date(task.startDate) : new Date(),
    dueDate: initialDueDate,
    remarks: task?.remarks || '',
  });

  // Include Sundays checkbox
  const [includeSundays, setIncludeSundays] = useState<boolean>(
    task?.dateRange?.includeSundays !== undefined ? task.dateRange.includeSundays : true
  );

  // Validation errors
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    assignedTo: '',
    startDate: '',
    dueDate: '',
  });

  // Loading state for employees and form submission
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);
  const { user } = useAuth();

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        setFetchError('');
        
        const response = await fetch('/api/users?isActive=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        if (data.success) {
          // Filter users based on role
          let filteredUsers = data.users || [];
          
          // If user is a manager, they can only assign to employees
          if (user?.role === 'MANAGER') {
            filteredUsers = filteredUsers.filter((u: any) => u.role === 'EMPLOYEE');
          }
          // If user is super admin, they can assign to anyone
          else if (user?.role === 'SUPER_ADMIN') {
            filteredUsers = filteredUsers.filter((u: any) => 
              u.role === 'EMPLOYEE' || u.role === 'MANAGER' || u.role === 'SUPER_ADMIN'
            );
          }
          
          setEmployees(filteredUsers);
        } else {
          throw new Error(data.message || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setFetchError('Failed to load users.');
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [user]);

  // Calculate due date based on task type when start date or task type changes
  useEffect(() => {
    // Only auto-calculate if the user didn't manually set a specific due date
    // or if we're changing the task type
    if (!task || !task.dueDate) {
      let newDueDate;
      
      switch (formData.taskType) {
        case 'DAILY':
        case 'DAILY_RECURRING':
          // For daily tasks, set due date to 1 day after start date
          newDueDate = addDays(formData.startDate, 1);
          break;
        case 'WEEKLY':
        case 'WEEKLY_RECURRING':
          // For weekly tasks, set due date to 7 days after start date
          newDueDate = addDays(formData.startDate, 7);
          break;
        case 'MONTHLY':
        case 'MONTHLY_RECURRING':
          // For monthly tasks, set due date to 30 days after start date
          newDueDate = addDays(formData.startDate, 30);
          break;
        default:
          // Default to 1 day
          newDueDate = addDays(formData.startDate, 1);
      }
      
      setFormData(prevData => ({
        ...prevData,
        dueDate: newDueDate
      }));
    }
  }, [formData.taskType, formData.startDate, task]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value,
    });

    // Clear error when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name as string]: '',
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;
    
    // Special handling for assignedTo multi-select
    if (name === 'assignedTo') {
      // Handle select all option
      if (Array.isArray(value) && value.includes('select-all')) {
        // If select-all is clicked, select all employees
        setFormData({
          ...formData,
          assignedTo: employees.map(emp => emp._id)
        });
      } else {
        setFormData({
          ...formData,
          assignedTo: value as string[]
        });
      }
    } else {
      setFormData({
        ...formData,
        [name as string]: value,
      });
    }

    // Clear error when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name as string]: '',
      });
    }
  };

  // Handle start date change
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        startDate: date,
      });
      
      // Reset startDate error if any
      if (errors.startDate) {
        setErrors({
          ...errors,
          startDate: '',
        });
      }
      
      // Adjust due date based on task type and new start date
      let newDueDate;
      
      switch (formData.taskType) {
        case 'DAILY':
          newDueDate = addDays(date, 1);
          break;
        case 'WEEKLY':
          newDueDate = addDays(date, 7);
          break;
        case 'MONTHLY':
          newDueDate = addMonths(date, 1);
          break;
        default:
          newDueDate = addDays(date, 1);
      }
      
      setFormData(prevData => ({
        ...prevData,
        dueDate: newDueDate
      }));
    }
  };

  // Handle due date change
  const handleDueDateChange = (date: Date | null) => {
    if (date) {
      // Preserve the time from the current dueDate when changing the date
      const hours = formData.dueDate.getHours();
      const minutes = formData.dueDate.getMinutes();
      
      const newDueDate = setMinutes(setHours(date, hours), minutes);
      
      setFormData({
        ...formData,
        dueDate: newDueDate,
      });
      
      // Reset dueDate error if any
      if (errors.dueDate) {
        setErrors({
          ...errors,
          dueDate: '',
        });
      }
    }
  };
  
  // Handle due time change
  const handleDueTimeChange = (time: Date | null) => {
    if (time) {
      // Keep the date from dueDate but use hours and minutes from the new time
      const newDueDate = new Date(formData.dueDate);
      newDueDate.setHours(time.getHours());
      newDueDate.setMinutes(time.getMinutes());
      
      setFormData({
        ...formData,
        dueDate: newDueDate,
      });
    }
  };

  // Handle Sunday checkbox change
  const handleIncludeSundaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeSundays(e.target.checked);
  };

  // Validate form before submission
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Check title
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
      isValid = false;
    }

    // Check description
    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
      isValid = false;
    }

    // Check assignedTo
    if (!formData.assignedTo.length) {
      newErrors.assignedTo = 'At least one employee must be assigned to the task';
      isValid = false;
    }

    // Check dates
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
      isValid = false;
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
      isValid = false;
    }

    // Check if due date is after start date
    if (formData.startDate && formData.dueDate && formData.startDate > formData.dueDate) {
      newErrors.dueDate = 'Due date must be after start date';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    try {
      // Determine if this is a create or update operation
      const url = task && task._id 
        ? `/api/tasks/${task._id}` 
        : '/api/tasks';
      
      const method = task && task._id ? 'PUT' : 'POST';
      
      // Prepare task data for submission
      const taskData = {
        ...formData,
        dateRange: {
          includeSundays
        }
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        onSubmit(true);
      } else {
        setSubmitError(data.message || 'Failed to save task.');
        onSubmit(false);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      onSubmit(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Task type description helper
  const getTaskTypeDescription = () => {
    switch (formData.taskType) {
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

  // Render form
  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      sx={{ p: 3 }}
    >
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}
      
      {fetchError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {fetchError}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Title */}
        <TextField
          fullWidth
          label="Task Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={!!errors.title}
          helperText={errors.title}
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
          name="description"
          multiline
          rows={4}
          value={formData.description}
          onChange={handleChange}
          error={!!errors.description}
          helperText={errors.description}
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

        {/* Task Type and Status Row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {/* Task Type */}
          <FormControl fullWidth>
            <InputLabel id="task-type-label">Task Type</InputLabel>
            <Select
              labelId="task-type-label"
              id="task-type"
              name="taskType"
              value={formData.taskType}
              label="Task Type"
              onChange={handleSelectChange}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(primaryColor, 0.5),
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryColor,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryColor,
                },
                '& .MuiSvgIcon-root': {
                  color: primaryColor,
                }
              }}
            >
              <MenuItem value="DAILY">Daily Task</MenuItem>
              <MenuItem value="WEEKLY">Weekly Task</MenuItem>
              <MenuItem value="MONTHLY">Monthly Task</MenuItem>
              <MenuItem value="DAILY_RECURRING">Daily Recurring</MenuItem>
              <MenuItem value="WEEKLY_RECURRING">Weekly Recurring</MenuItem>
              <MenuItem value="MONTHLY_RECURRING">Monthly Recurring</MenuItem>
            </Select>
            <FormHelperText>
              {getTaskTypeDescription()}
            </FormHelperText>
          </FormControl>

          {/* Task Status */}
          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleSelectChange}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(primaryColor, 0.5),
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryColor,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: primaryColor,
                },
                '& .MuiSvgIcon-root': {
                  color: primaryColor,
                }
              }}
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              {task && (
                <MenuItem value="COMPLETED">Completed</MenuItem>
              )}
              <MenuItem value="DELAYED">Delayed</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Priority */}
        <FormControl fullWidth>
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            labelId="priority-label"
            id="priority"
            name="priority"
            value={formData.priority || 'MEDIUM'}
            label="Priority"
            onChange={handleSelectChange}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(primaryColor, 0.5),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: primaryColor,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: primaryColor,
              },
              '& .MuiSvgIcon-root': {
                color: primaryColor,
              }
            }}
          >
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
          </Select>
        </FormControl>

        {/* Assigned To */}
        <FormControl fullWidth error={!!errors.assignedTo}>
          <InputLabel id="assigned-to-label">Assigned To</InputLabel>
          <Select
            labelId="assigned-to-label"
            id="assigned-to"
            name="assignedTo"
            multiple
            value={formData.assignedTo}
            onChange={handleSelectChange}
            label="Assigned To"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => {
                  const user = employees.find(emp => emp._id === value);
                  return user ? (
                    <Chip 
                      key={value} 
                      label={user.name} 
                      size="small"
                      sx={{ 
                        bgcolor: alpha(primaryColor, 0.1),
                        color: primaryColor,
                        fontWeight: 500
                      }}
                    />
                  ) : null;
                })}
              </Box>
            )}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: errors.assignedTo ? 'error.main' : alpha(primaryColor, 0.5),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: errors.assignedTo ? 'error.main' : primaryColor,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: errors.assignedTo ? 'error.main' : primaryColor,
              },
              '& .MuiSvgIcon-root': {
                color: primaryColor,
              }
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                },
              },
            }}
            disabled={isLoading || employees.length === 0}
          >
            {employees.map((employee) => (
              <MenuItem key={employee._id} value={employee._id}>
                {employee.name}
              </MenuItem>
            ))}
          </Select>
          {errors.assignedTo && (
            <FormHelperText error>{errors.assignedTo}</FormHelperText>
          )}
          {formData.assignedTo.length > 1 && (
            <FormHelperText>
              {formData.assignedTo.length === employees.length 
                ? `All users (${employees.length}) assigned to this task.` 
                : `Multiple users (${formData.assignedTo.length}) assigned. All will receive notifications.`}
            </FormHelperText>
          )}
        </FormControl>
        
        {/* Quick Select buttons */}
        <Box sx={{ mt: 1, mb: 2 }}>
          <Button 
            size="small" 
            onClick={() => {
              const allEmployeeIds = employees.map(emp => emp._id);
              setFormData({
                ...formData,
                assignedTo: allEmployeeIds
              });
            }}
            disabled={isLoading || employees.length === 0 || formData.assignedTo.length === employees.length}
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
              setFormData({
                ...formData,
                assignedTo: []
              });
            }}
            disabled={isLoading || formData.assignedTo.length === 0}
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
              value={formData.startDate}
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.startDate,
                  helperText: errors.startDate,
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
              label="Due Date"
              value={formData.dueDate}
              onChange={handleDueDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.dueDate,
                  helperText: errors.dueDate || "Set the deadline date for this task",
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
        
        {/* Time Row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ width: '50%' }}></Box>
          {/* Due Time */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="Due Time"
              value={formData.dueDate}
              onChange={handleDueTimeChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: "Set the deadline time for this task",
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

        {/* Sunday option - for all task types */}
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
          value={formData.remarks}
          onChange={handleChange}
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

        {/* Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            onClick={onCancel}
            sx={{ 
              mr: 2,
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ 
              bgcolor: primaryColor,
              '&:hover': {
                bgcolor: '#e05a15',
              },
              minWidth: 120
            }}
          >
            {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default TaskForm; 