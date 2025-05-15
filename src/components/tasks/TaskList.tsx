'use client';

import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Stack,
  useTheme,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Grid as MuiGrid,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  DateRange as DateRangeIcon,
  Clear as ClearIcon,
  Update as UpdateIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  Assignment as AssignIcon,
  Delete as BatchDeleteIcon,
  CheckCircleOutline as BatchCompleteIcon,
  Update as BatchUpdateIcon,
  PriorityHigh as PriorityHighIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Status enum to map status values to readable text and colors
const TaskStatus = {
  PENDING: { text: 'Pending', color: 'info' },
  IN_PROGRESS: { text: 'In Progress', color: 'warning' },
  COMPLETED: { text: 'Completed', color: 'success' },
  DELAYED: { text: 'Delayed', color: 'error' },
  INCOMPLETE: { text: 'Incomplete', color: 'error' },
} as const;

// Task type enum for displaying in UI
const TaskTypes = {
  DAILY: { text: 'Daily', color: 'default' },
  WEEKLY: { text: 'Weekly', color: 'default' },
  MONTHLY: { text: 'Monthly', color: 'default' },
  DAILY_RECURRING: { text: 'Daily Recurring', color: 'primary' },
  WEEKLY_RECURRING: { text: 'Weekly Recurring', color: 'primary' },
  MONTHLY_RECURRING: { text: 'Monthly Recurring', color: 'primary' },
} as const;

// Create a properly typed Grid component to fix TypeScript errors
const Grid = MuiGrid;

export default function TaskList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { user } = useAuth();
  
  // State for tasks data and loading
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTasks, setTotalTasks] = useState(0);
  
  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('');
  
  // State for task deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // State for selected tasks
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  // State for batch operations menu
  const [batchMenuAnchor, setBatchMenuAnchor] = useState<null | HTMLElement>(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [batchStatusDialogOpen, setBatchStatusDialogOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string>('');
  
  // Derived state for batch operations
  const isBatchMenuOpen = Boolean(batchMenuAnchor);
  const hasSelectedTasks = selectedTasks.length > 0;
  
  // Fetch tasks on component mount and when filters change
  useEffect(() => {
    fetchTasks();
  }, [page, rowsPerPage, searchQuery, statusFilter, typeFilter, assignmentFilter]);
  
  // Fetch tasks from the API
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', (page + 1).toString()); // API uses 1-based pages
      queryParams.append('limit', rowsPerPage.toString());
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (statusFilter) {
        queryParams.append('status', statusFilter);
      }
      
      if (typeFilter) {
        queryParams.append('taskType', typeFilter);
      }
      
      if (assignmentFilter) {
        queryParams.append('assignment', assignmentFilter);
      }
      
      // Make API request
      const response = await fetch(`/api/tasks?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
        setTotalTasks(data.pagination.total);
      } else {
        setError(data.message || 'Failed to fetch tasks');
        setTasks([]);
        setTotalTasks(0);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again later.');
      setTasks([]);
      setTotalTasks(0);
    } finally {
      setLoading(false);
    }
  };
  
  // Update the handleChangePage function
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Update handleChangeRowsPerPage
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Update handleSearchChange to add debounce
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when search changes
  };
  
  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(0);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };
  
  // Handle type filter change
  const handleTypeFilterChange = (event: SelectChangeEvent) => {
    setTypeFilter(event.target.value);
    setPage(0);
  };
  
  // Handle assignment filter change
  const handleAssignmentFilterChange = (event: SelectChangeEvent) => {
    setAssignmentFilter(event.target.value);
    setPage(0);
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setTypeFilter('');
    setAssignmentFilter('');
    setPage(0);
  };
  
  // Navigate to create task page
  const handleCreateTask = () => {
    router.push('/dashboard/tasks/create');
  };
  
  // Navigate to task details page
  const handleViewTaskDetails = (taskId: string) => {
    router.push(`/dashboard/tasks/${taskId}`);
  };
  
  // Navigate to task details page for updating progress
  const handleUpdateTask = (taskId: string, event?: React.MouseEvent) => {
    // Stop event propagation to prevent row click from triggering
    if (event) {
      event.stopPropagation();
    }
    router.push(`/dashboard/tasks/${taskId}`);
  };
  
  // Navigate to edit task page
  const handleEditTask = (taskId: string, event?: React.MouseEvent) => {
    // Stop event propagation to prevent row click from triggering
    if (event) {
      event.stopPropagation();
    }
    router.push(`/dashboard/tasks/edit/${taskId}`);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (taskId: string, event?: React.MouseEvent) => {
    // Stop event propagation to prevent row click from triggering
    if (event) {
      event.stopPropagation();
    }
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };
  
  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setTaskToDelete(null);
    setDeleteDialogOpen(false);
  };
  
  // Handle task deletion via API
  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    
    setDeleteLoading(true);
    
    try {
      // Make API request to delete the task
      const response = await fetch(`/api/tasks/${taskToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Remove task from local state
        setTasks(tasks.filter(task => task._id !== taskToDelete));
        setTotalTasks(prev => prev - 1);
        
        // Close dialog
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
      } else {
        setError(data.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again later.');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Handle mark as complete via API
  const handleMarkComplete = async (taskId: string) => {
    try {
      // Make API request to mark the task as complete
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark task as complete');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update task status in local state
        setTasks(tasks.map(task => 
          task._id === taskId 
            ? { ...task, status: 'COMPLETED', completedAt: new Date().toISOString() } 
            : task
        ));
      } else {
        setError(data.message || 'Failed to mark task as complete');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status. Please try again later.');
    }
  };
  
  // Batch operations handlers
  const openBatchMenu = (event: React.MouseEvent<HTMLElement>) => {
    setBatchMenuAnchor(event.currentTarget);
  };

  const closeBatchMenu = () => {
    setBatchMenuAnchor(null);
  };

  const handleSelectAllTasks = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedTasks(tasks.map(task => task._id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleBatchUpdateStatus = () => {
    setBatchStatusDialogOpen(true);
    closeBatchMenu();
  };

  const handleBatchDeleteClick = () => {
    setBatchDeleteDialogOpen(true);
    closeBatchMenu();
  };

  const handleBatchStatusChange = (event: SelectChangeEvent) => {
    setBatchStatus(event.target.value);
  };

  const handleBatchStatusConfirm = async () => {
    if (selectedTasks.length === 0 || !batchStatus) return;
    
    setBatchActionLoading(true);
    
    try {
      const response = await fetch('/api/tasks/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'updateStatus',
          taskIds: selectedTasks,
          data: { status: batchStatus }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tasks');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh tasks
        fetchTasks();
        
        // Close dialog and reset
        setBatchStatusDialogOpen(false);
        setBatchStatus('');
        setSelectedTasks([]);
      } else {
        setError(data.message || 'Failed to update tasks');
      }
    } catch (err) {
      console.error('Error updating tasks:', err);
      setError('Failed to update tasks. Please try again later.');
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchDeleteConfirm = async () => {
    if (selectedTasks.length === 0) return;
    
    setBatchActionLoading(true);
    
    try {
      const response = await fetch('/api/tasks/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'delete',
          taskIds: selectedTasks,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tasks');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh tasks
        fetchTasks();
        
        // Close dialog and reset
        setBatchDeleteDialogOpen(false);
        setSelectedTasks([]);
      } else {
        setError(data.message || 'Failed to delete tasks');
      }
    } catch (err) {
      console.error('Error deleting tasks:', err);
      setError('Failed to delete tasks. Please try again later.');
    } finally {
      setBatchActionLoading(false);
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Filters section */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden'
        }}
        className="task-filters"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search row */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClearSearch}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          
          {/* Filters and action row */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: 2, 
            alignItems: { xs: 'stretch', md: 'center' },
            flexWrap: 'wrap'
          }}>
            {/* Filter containers */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flex: 1,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              '& .MuiFormControl-root': { 
                minWidth: { xs: '100%', sm: '180px' },
                flex: 1
              },
              '& .MuiInputLabel-root': {
                backgroundColor: 'background.paper',
                px: 0.5,
                lineHeight: '1',
                transform: 'translate(14px, -6px) scale(0.75)'
              }
            }}>
              <TextField
                select
                size="small"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e as SelectChangeEvent)}
                label="Status"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mt: -0.5 }}>
                      <FilterListIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="DELAYED">Delayed</MenuItem>
              </TextField>
              
              <TextField
                select
                size="small"
                value={typeFilter}
                onChange={(e) => handleTypeFilterChange(e as SelectChangeEvent)}
                label="Task Type"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mt: -0.5 }}>
                      <CategoryIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="DAILY_RECURRING">Daily Recurring</MenuItem>
                <MenuItem value="WEEKLY_RECURRING">Weekly Recurring</MenuItem>
                <MenuItem value="MONTHLY_RECURRING">Monthly Recurring</MenuItem>
              </TextField>
              
              {(user && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER')) && (
                <TextField
                  select
                  size="small"
                  value={assignmentFilter}
                  onChange={(e) => handleAssignmentFilterChange(e as SelectChangeEvent)}
                  label="Assignment"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mt: -0.5 }}>
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                >
                  <MenuItem value="">All Tasks</MenuItem>
                  <MenuItem value="assignedToMe">Assigned To Me</MenuItem>
                  <MenuItem value="assignedByMe">Assigned By Me</MenuItem>
                </TextField>
              )}
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center'
            }}>
              <Button 
                startIcon={<AddIcon />} 
                variant="contained" 
                color="primary"
                onClick={handleCreateTask}
              >
                New Task
              </Button>
              <Tooltip title="Batch Operations">
                <IconButton 
                  color={batchMenuAnchor ? "primary" : "default"} 
                  onClick={openBatchMenu}
                  sx={{ border: 1, borderColor: 'divider', p: 1 }}
                >
                  <PlaylistAddCheckIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Task table */}
      <Paper 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          width: '100%'
        }}
      >
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Typography variant="body1" color="textSecondary" sx={{ p: 4, textAlign: 'center' }}>
            No tasks found.
          </Typography>
        ) : (
          <>
            <TableContainer 
              sx={{ 
                maxHeight: { 
                  xs: 'unset', // Remove fixed height constraint for mobile
                  sm: 'calc(100vh - 280px)' 
                },
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch', // Add smooth scrolling on iOS
              }}
            >
              <Table stickyHeader aria-label="tasks table" size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Assigned By</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow 
                      key={task._id} 
                      hover
                      onClick={() => handleViewTaskDetails(task._id)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {task.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                          <Typography variant="body2">
                            {task.assignedTo && task.assignedTo.name
                              ? task.assignedTo.name
                              : 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                          <Typography variant="body2">
                            {task.createdBy && task.createdBy.name
                              ? task.createdBy.name
                              : 'System'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DateRangeIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                          <Typography variant="body2">
                            {task.startDate ? format(new Date(task.startDate), 'MMM d, yyyy') : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DateRangeIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                          <Typography variant="body2">
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip
                          label={TaskStatus[task.status as keyof typeof TaskStatus]?.text || task.status}
                          color={
                            (TaskStatus[task.status as keyof typeof TaskStatus]?.color as any) ||
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Chip
                          label={TaskTypes[task.taskType as keyof typeof TaskTypes]?.text || task.taskType}
                          color={
                            (TaskTypes[task.taskType as keyof typeof TaskTypes]?.color as any) ||
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PriorityHighIcon 
                            fontSize="small" 
                            sx={{ 
                              mr: 1, 
                              color: task.priority === 'HIGH' 
                                ? 'error.main' 
                                : task.priority === 'MEDIUM'
                                ? 'warning.main'
                                : 'info.main'
                            }} 
                          />
                          <Typography variant="body2">
                            {task.priority || 'Low'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Update Progress">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => handleUpdateTask(task._id, e)}
                            >
                              <UpdateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {user && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') && (
                            <>
                              <Tooltip title="Edit Task">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={(e) => handleEditTask(task._id, e)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Task">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => handleDeleteClick(task._id, e)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalTasks}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Batch actions menu */}
      <Menu
        anchorEl={batchMenuAnchor}
        open={isBatchMenuOpen}
        onClose={closeBatchMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleBatchUpdateStatus}>
          <ListItemIcon>
            <BatchUpdateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleBatchDeleteClick}>
          <ListItemIcon>
            <BatchDeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete Tasks" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>

      {/* Batch Status Update Dialog */}
      <Dialog
        open={batchStatusDialogOpen}
        onClose={() => setBatchStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Update Tasks Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select the new status to apply to all {selectedTasks.length} selected tasks:
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={batchStatus}
              onChange={handleBatchStatusChange}
              label="Status"
            >
              {Object.entries(TaskStatus).map(([value, { text }]) => (
                <MenuItem key={value} value={value}>
                  {text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBatchStatusDialogOpen(false)}
            disabled={batchActionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBatchStatusConfirm}
            color="primary"
            variant="contained"
            disabled={batchActionLoading || !batchStatus}
          >
            {batchActionLoading ? 'Updating...' : 'Update All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog
        open={batchDeleteDialogOpen}
        onClose={() => setBatchDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Multiple Tasks</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedTasks.length} selected tasks? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBatchDeleteDialogOpen(false)}
            disabled={batchActionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBatchDeleteConfirm}
            color="error"
            variant="contained"
            disabled={batchActionLoading}
          >
            {batchActionLoading ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 