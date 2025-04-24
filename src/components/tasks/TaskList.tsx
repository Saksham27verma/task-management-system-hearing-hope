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
  Grid,
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
  PlaylistAddCheck as BatchActionIcon,
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
} as const;

export default function TaskList() {
  const theme = useTheme();
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
  }, [page, rowsPerPage, searchQuery, statusFilter, typeFilter]);
  
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
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(0);
  };
  
  // Navigate to create task page
  const handleCreateTask = () => {
    router.push('/dashboard/tasks/create');
  };
  
  // Navigate to edit task page
  const handleEditTask = (taskId: string) => {
    router.push(`/dashboard/tasks/edit/${taskId}`);
  };
  
  // Navigate to task details page for updating progress
  const handleUpdateTask = (taskId: string) => {
    router.push(`/dashboard/tasks/${taskId}`);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (taskId: string) => {
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
          p: { xs: 1, sm: 2 }, 
          mb: 2, 
          borderRadius: 2,
          overflow: 'hidden'
        }}
        className="task-filters"
      >
        <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e as SelectChangeEvent)}
              label="Status"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="delayed">Delayed</MenuItem>
            </TextField>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e as SelectChangeEvent)}
              label="Task Type"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="documentation">Documentation</MenuItem>
              <MenuItem value="research">Research</MenuItem>
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="testing">Testing</MenuItem>
              <MenuItem value="deployment">Deployment</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </TextField>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                startIcon={<AddIcon />} 
                variant="contained" 
                onClick={handleCreateTask}
                sx={{ flexGrow: { xs: 1, md: 0 }, whiteSpace: 'nowrap' }}
              >
                New Task
              </Button>
              
              <IconButton 
                color="primary" 
                onClick={() => {
                  handleResetFilters();
                  fetchTasks();
                }}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
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
            <TableContainer sx={{ maxHeight: { xs: 'calc(100vh - 300px)', sm: 'calc(100vh - 280px)' } }}>
              <Table stickyHeader aria-label="tasks table" size={useMediaQuery('(max-width:600px)') ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task._id} hover>
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
                          <DateRangeIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                          <Typography variant="body2">
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={TaskStatus[task.status as keyof typeof TaskStatus]?.text || task.status}
                          color={
                            (TaskStatus[task.status as keyof typeof TaskStatus]?.color as any) ||
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
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
                        <Chip
                          label={TaskStatus[task.status as keyof typeof TaskStatus]?.text || task.status}
                          color={
                            (TaskStatus[task.status as keyof typeof TaskStatus]?.color as any) ||
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Update Progress">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleUpdateTask(task._id)}
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
                                  onClick={() => handleEditTask(task._id)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Task">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteClick(task._id)}
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