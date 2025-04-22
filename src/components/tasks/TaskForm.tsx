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
  Divider
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format, addMonths } from 'date-fns';
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
  // Convert assignedTo to array if it's a string (for backwards compatibility)
  const initialAssignedTo = task?.assignedTo
    ? Array.isArray(task.assignedTo)
      ? task.assignedTo
      : [task.assignedTo]
    : [];

  // Default formData state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    assignedTo: string[];
    taskType: TaskType;
    status: TaskStatus;
    startDate: Date;
    dueDate: Date;
    remarks: string;
  }>({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: initialAssignedTo,
    taskType: task?.taskType || 'DAILY',
    status: task?.status || 'PENDING',
    startDate: task?.startDate ? new Date(task.startDate) : new Date(),
    dueDate: task?.dueDate ? new Date(task.dueDate) : addDays(new Date(), 1), // Default to 1 day from now
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
        
        // For development/testing, use mock data if API fails
        const useMockData = false;
        
        if (!useMockData) {
          // In production, enable this code instead of mock data
          const response = await fetch('/api/users?isActive=true');
          
          if (!response.ok) {
            throw new Error('Failed to fetch employees');
          }

          const data = await response.json();
          if (data.success) {
            // Filter the users to only include EMPLOYEE and MANAGER roles
            const filteredUsers = data.users.filter((user: any) => 
              user.role === 'EMPLOYEE' || user.role === 'MANAGER'
            );
            setEmployees(filteredUsers);
          } else {
            throw new Error(data.message || 'Failed to fetch employees');
          }
        } else {
          // Use mock data for development
          console.log('Using mock employee data');
          setEmployees([
            { _id: '1', name: 'John Doe' },
            { _id: '2', name: 'Jane Smith' },
            { _id: '3', name: 'Mark Johnson' },
            { _id: '4', name: 'Emily Brown' },
            { _id: '5', name: 'Robert Wilson' },
            { _id: '6', name: 'Sarah Taylor' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        setFetchError('Failed to load employees. Using sample data instead.');
        
        // Always provide some mock data as fallback
        setEmployees([
          { _id: '1', name: 'John Doe' },
          { _id: '2', name: 'Jane Smith' },
          { _id: '3', name: 'Mark Johnson' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Calculate due date based on task type when start date or task type changes
  useEffect(() => {
    // Only auto-calculate if the user didn't manually set a specific due date
    // or if we're changing the task type
    if (!task || !task.dueDate) {
      let newDueDate;
      
      switch (formData.taskType) {
        case 'DAILY':
          // For daily tasks, set due date to 1 day after start date
          newDueDate = addDays(formData.startDate, 1);
          break;
        case 'WEEKLY':
          // For weekly tasks, set due date to 7 days after start date
          newDueDate = addDays(formData.startDate, 7);
          break;
        case 'MONTHLY':
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

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent<string | string[]>) => {
    const { name, value } = e.target;
    
    if (name === 'assignedTo') {
      // Check if the select-all option was clicked
      if (Array.isArray(value) && value.includes('select-all')) {
        // Select all employees
        const allEmployeeIds = employees.map(emp => emp._id);
        setFormData({
          ...formData,
          assignedTo: allEmployeeIds
        });
      } else {
        // Handle regular multiple selection
        setFormData({
          ...formData,
          [name]: typeof value === 'string' ? value.split(',') : value
        });
      }
    } else {
      // Handle regular select fields
      setFormData({
        ...formData,
        [name]: value as string
      });
    }
  };

  // Handle start date change
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prevData => {
        // Calculate new due date based on task type and new start date
        let newDueDate;
        
        switch (prevData.taskType) {
          case 'DAILY':
            newDueDate = addDays(date, 1);
            break;
          case 'WEEKLY':
            newDueDate = addDays(date, 7);
            break;
          case 'MONTHLY':
            newDueDate = addDays(date, 30);
            break;
          default:
            newDueDate = addDays(date, 1);
        }
        
        return {
          ...prevData,
          startDate: date,
          dueDate: newDueDate
        };
      });
      
      // Clear error
      if (errors.startDate) {
        setErrors({
          ...errors,
          startDate: '',
        });
      }
    }
  };

  // Handle due date change - manual override
  const handleDueDateChange = (date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        dueDate: date,
      });
      
      // Clear error
      if (errors.dueDate) {
        setErrors({
          ...errors,
          dueDate: '',
        });
      }
    }
  };

  // Handle Sunday inclusion toggle
  const handleIncludeSundaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeSundays(e.target.checked);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      title: '',
      description: '',
      assignedTo: '',
      startDate: '',
      dueDate: '',
    };

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Assigned to validation
    if (!formData.assignedTo.length) {
      newErrors.assignedTo = 'Please select at least one employee';
    }

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    // Due date validation
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (formData.dueDate < formData.startDate) {
      newErrors.dueDate = 'Due date cannot be earlier than start date';
    }

    setErrors(newErrors);

    // Return true if no errors (all values in newErrors are empty strings)
    return Object.values(newErrors).every(error => !error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError('');

    const apiUrl = task?._id 
      ? `/api/tasks/${task._id}` 
      : '/api/tasks';
    
    // Prepare data for weekly or monthly tasks
    const taskData = {
      ...formData,
      assignedTo: formData.assignedTo, // Pass the array of users
    };

    try {
      const response = await fetch(apiUrl, {
        method: task?._id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSubmit(true);
      } else {
        throw new Error(data.message || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setSubmitError('An error occurred while saving the task. Please try again.');
      onSubmit(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Get task type description
  const getTaskTypeDescription = () => {
    switch (formData.taskType) {
      case 'DAILY':
        return 'Daily tasks occur every day with a due date of 1 day after the start date.';
      case 'WEEKLY':
        return 'Weekly tasks occur weekly with a due date of 7 days after the start date.';
      case 'MONTHLY':
        return 'Monthly tasks occur monthly with a due date of 30 days after the start date.';
      default:
        return '';
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
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
        />

        {/* Task Type and Status Row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {/* Task Type */}
          <FormControl fullWidth>
            <InputLabel id="task-type-label">Task Type</InputLabel>
            <Select
              labelId="task-type-label"
              name="taskType"
              value={formData.taskType}
              onChange={handleSelectChange}
              label="Task Type"
            >
              <MenuItem value="DAILY">Daily Task</MenuItem>
              <MenuItem value="WEEKLY">Weekly Recurring Task</MenuItem>
              <MenuItem value="MONTHLY">Monthly Recurring Task</MenuItem>
            </Select>
            <FormHelperText>{getTaskTypeDescription()}</FormHelperText>
          </FormControl>

          {/* Status - only for editing */}
          {task && (
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                label="Status"
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="DELAYED">Delayed</MenuItem>
              </Select>
            </FormControl>
          )}
        </Stack>

        {/* Assigned To */}
        <FormControl 
          fullWidth 
          margin="normal" 
          error={!!errors.assignedTo}
        >
          <InputLabel id="assignedTo-label">Assigned To</InputLabel>
          <Select
            labelId="assignedTo-label"
            id="assignedTo"
            name="assignedTo"
            multiple
            value={formData.assignedTo}
            onChange={handleSelectChange}
            label="Assigned To"
            disabled={isLoading}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => {
                  const employee = employees.find(emp => emp._id === value);
                  return (
                    <Chip 
                      key={value} 
                      label={employee ? employee.name : value} 
                      size="small"
                    />
                  );
                })}
              </Box>
            )}
          >
            {/* New Select All option */}
            <MenuItem 
              value="select-all"
              sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}
            >
              Select All Employees ({employees.length})
            </MenuItem>
            {employees.map((employee) => (
              <MenuItem key={employee._id} value={employee._id}>
                {employee.name}
              </MenuItem>
            ))}
          </Select>
          {errors.assignedTo && (
            <FormHelperText>{errors.assignedTo}</FormHelperText>
          )}
          {formData.assignedTo.length > 1 && (
            <FormHelperText>
              {formData.assignedTo.length === employees.length 
                ? `All employees (${employees.length}) assigned to this task.` 
                : `Multiple employees (${formData.assignedTo.length}) assigned. All will receive notifications.`}
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
            sx={{ mr: 1 }}
          >
            Select All Employees
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
                },
              }}
            />
          </LocalizationProvider>

          {/* Due Date */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Due Date (Auto-calculated)"
              value={formData.dueDate}
              onChange={handleDueDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.dueDate,
                  helperText: errors.dueDate || "Due date is automatically calculated based on task type",
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
        />

        {/* Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            onClick={onCancel}
            sx={{ mr: 2 }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default TaskForm; 