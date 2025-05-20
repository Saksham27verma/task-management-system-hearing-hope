import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Button,
  DialogActions,
  Paper,
  ListItemSecondaryAction,
  Tooltip,
  Collapse,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Task, TaskStatus } from '@/types/Task';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/contexts/TaskContext';
import { useUsers } from '@/contexts/UserContext';

interface TaskManagementDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 1 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `task-tab-${index}`,
    'aria-controls': `task-tabpanel-${index}`,
  };
}

const TaskManagementDialog: React.FC<TaskManagementDialogProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primaryColor = '#EE6417';
  const { user } = useAuth();
  const { tasks, fetchTasks, isLoading } = useTasks();
  const { users, fetchUsers, isLoading: usersLoading } = useUsers();
  
  const [tabValue, setTabValue] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'my' | 'all' | 'user'>('my');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users;
    
    const query = userSearchQuery.toLowerCase();
    return users.filter(user => 
      (user.name?.toLowerCase().includes(query)) || 
      (user.email?.toLowerCase().includes(query)) ||
      (user.position?.toLowerCase().includes(query))
    );
  }, [users, userSearchQuery]);
  
  // Get user name by ID
  const getUserName = (userId: string): string => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name || foundUser.email : 'User';
  };
  
  // Handle user selection change
  const handleUserChange = (event: SelectChangeEvent<string>) => {
    const userId = event.target.value;
    console.log(`Selected user: ${userId || 'All Users'}`);
    
    if (userId) {
      setSelectedUserId(userId);
      setViewMode('user');
    } else {
      setSelectedUserId(null);
      setViewMode('all');
    }
  };
  
  // Filter tasks by status and based on view mode
  const filterTasks = (status: TaskStatus) => {
    // For debugging
    console.log('Filtering tasks:', { 
      status, 
      viewMode,
      userId: user?.id,
      selectedUserId,
      tasks: tasks.map(t => ({ id: t.id, status: t.status, assignedTo: t.assignedTo }))
    });
    
    // First filter by status for all tasks
    const statusFiltered = tasks.filter(task => task.status === status);
    
    // Then filter based on view mode
    if (viewMode === 'my' && user?.id) {
      // My tasks - current user only
      return statusFiltered.filter(task => 
        task.assignedTo && 
        Array.isArray(task.assignedTo) && 
        task.assignedTo.includes(user.id)
      );
    } else if (viewMode === 'user' && selectedUserId) {
      // Selected user's tasks
      return statusFiltered.filter(task =>
        task.assignedTo &&
        Array.isArray(task.assignedTo) &&
        task.assignedTo.includes(selectedUserId)
      );
    }
    
    // Otherwise return all tasks with the specified status
    return statusFiltered;
  };
  
  const pendingTasks = filterTasks('pending');
  const inProgressTasks = filterTasks('in-progress');
  const completedTasks = filterTasks('completed');
  const overdueTasks = filterTasks('overdue');
  
  // Load tasks when dialog opens
  useEffect(() => {
    if (open) {
      console.log("TaskManagementDialog opened, fetching tasks...");
      console.log("Current user:", user);
      refreshTasks();
      
      // Also make sure users are loaded in UserContext
      if (users.length === 0) {
        console.log("Loading users list for task filtering...");
        fetchUsers();
      }
    }
  }, [open, fetchTasks, users.length, fetchUsers]);
  
  const refreshTasks = async () => {
    setRefreshing(true);
    setError(null);
    try {
      console.log("Refreshing tasks, current user:", user?.id);
      await fetchTasks();
      console.log("Tasks refreshed successfully");
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedTaskId(taskId);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTaskId(null);
  };
  
  const handleExpandTask = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };
  
  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };
  
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    try {
      await taskService.deleteTask(taskToDelete.id);
      await refreshTasks();
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <HourglassEmptyIcon fontSize="small" sx={{ color: theme.palette.info.main }} />;
      case 'in-progress':
        return <AccessTimeIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />;
      case 'completed':
        return <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />;
      case 'overdue':
        return <ErrorIcon fontSize="small" sx={{ color: theme.palette.error.main }} />;
      default:
        return null;
    }
  };
  
  const getPriorityChip = (priority: string) => {
    let color: string;
    switch (priority) {
      case 'high':
        color = '#dc3545';
        break;
      case 'medium':
        color = '#ffc107';
        break;
      case 'low':
        color = '#198754';
        break;
      default:
        color = '#6c757d';
    }
    
    return (
      <Chip 
        label={priority.charAt(0).toUpperCase() + priority.slice(1)} 
        size="small"
        sx={{ 
          bgcolor: color,
          color: priority === 'medium' ? 'black' : 'white',
          fontSize: '0.7rem',
          height: 20,
        }}
      />
    );
  };
  
  // Render task item
  const renderTask = (task: Task) => {
    const isExpanded = expandedTaskId === task.id;
    
    return (
      <Paper 
        key={task.id} 
        elevation={1} 
        sx={{ 
          mb: 2, 
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <ListItem 
          component="div"
          onClick={() => handleExpandTask(task.id)}
          sx={{
            borderLeft: `4px solid ${
              task.status === 'completed' ? theme.palette.success.main :
              task.status === 'overdue' ? theme.palette.error.main :
              task.status === 'in-progress' ? theme.palette.warning.main :
              theme.palette.info.main
            }`,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: alpha(theme.palette.action.hover, 0.1),
            },
            cursor: 'pointer'
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon(task.status)}
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {task.title}
                </Typography>
              </Box>
            }
            secondary={
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                {getPriorityChip(task.priority)}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </Typography>
              </Box>
            }
          />
          
          <ListItemSecondaryAction>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                edge="end"
                aria-label="task menu"
                onClick={(e) => handleMenuOpen(e, task.id)}
                size="small"
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <IconButton 
                edge="end" 
                onClick={() => handleExpandTask(task.id)}
                size="small"
                sx={{ ml: 0.5 }}
              >
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
          </ListItemSecondaryAction>
        </ListItem>
        
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            <Typography variant="body2" gutterBottom>
              {task.description}
            </Typography>
            
            {task.taskType && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Type: {task.taskType.replace('_', ' ').toLowerCase()}
              </Typography>
            )}
            
            {task.startDate && (
              <Typography variant="caption" display="block" color="text.secondary">
                Start Date: {format(new Date(task.startDate), 'MMM d, yyyy')}
              </Typography>
            )}
            
            <Typography variant="caption" display="block" color="text.secondary">
              Due Date: {format(new Date(task.dueDate), 'MMM d, yyyy')}
            </Typography>
            
            {task.remarks && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Remarks: {task.remarks}
              </Typography>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Tooltip title="Delete Task">
                <Button
                  size="small"
                  startIcon={<DeleteIcon fontSize="small" />}
                  onClick={() => handleDeleteTask(task)}
                  sx={{ 
                    color: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                    }
                  }}
                >
                  Delete
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    );
  };
  
  // Recalculate when viewMode or tasks changes
  useEffect(() => {
    console.log(`View mode changed to: ${viewMode}, recalculating tasks...`);
    // This is just to force a re-render when viewMode changes
    // The actual filtering happens in the filterTasks function
  }, [viewMode, tasks]);
  
  // Ensure task filtering works correctly
  const debugTaskAssignments = () => {
    console.log('--------- TASK ASSIGNMENTS DEBUG ---------');
    console.log('Current user ID:', user?.id);
    console.log('Tasks with assignments:');
    tasks.forEach(task => {
      console.log(`Task "${task.title}" (${task.id}):`);
      console.log('  Status:', task.status);
      console.log('  Assigned to:', task.assignedTo);
      console.log('  Is assigned to current user:', user?.id ? task.assignedTo.includes(user.id) : 'No user logged in');
    });
    console.log('---------------------------------------');
  };
  
  // Debug task assignments when tasks or user changes
  useEffect(() => {
    if (tasks.length > 0) {
      debugTaskAssignments();
    }
  }, [tasks, user?.id]);
  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            height: 'auto',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" component="div">
              {viewMode === 'my' ? 'My Tasks' : selectedUserId ? `${getUserName(selectedUserId)}'s Tasks` : 'All Tasks'}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              overflow: 'hidden',
              ml: 1,
            }}>
              <Button 
                size="small"
                onClick={() => {
                  console.log("Switching to My Tasks view");
                  setViewMode('my');
                  setSelectedUserId(null);
                }}
                sx={{ 
                  px: 1.5,
                  py: 0.5,
                  minWidth: 0,
                  borderRadius: 0,
                  backgroundColor: viewMode === 'my' ? alpha(primaryColor, 0.2) : 'transparent',
                  color: viewMode === 'my' ? primaryColor : 'text.secondary',
                  '&:hover': {
                    backgroundColor: viewMode === 'my' ? alpha(primaryColor, 0.3) : alpha(theme.palette.action.hover, 0.1),
                  },
                  fontWeight: viewMode === 'my' ? 600 : 400,
                }}
              >
                My Tasks
              </Button>
              <Button 
                size="small"
                onClick={() => {
                  console.log("Switching to All Tasks view");
                  setViewMode('all');
                  setSelectedUserId(null);
                }}
                sx={{ 
                  px: 1.5,
                  py: 0.5,
                  minWidth: 0,
                  borderRadius: 0,
                  backgroundColor: viewMode === 'all' && !selectedUserId ? alpha(primaryColor, 0.2) : 'transparent',
                  color: viewMode === 'all' && !selectedUserId ? primaryColor : 'text.secondary',
                  '&:hover': {
                    backgroundColor: viewMode === 'all' && !selectedUserId ? alpha(primaryColor, 0.3) : alpha(theme.palette.action.hover, 0.1),
                  },
                  fontWeight: viewMode === 'all' && !selectedUserId ? 600 : 400,
                }}
              >
                All Tasks
              </Button>
            </Box>
            
            {/* User selection dropdown */}
            <FormControl size="small" sx={{ minWidth: 180, ml: 1 }}>
              <InputLabel id="user-select-label" sx={{ fontSize: '0.875rem' }}>Show Tasks For User</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                value={selectedUserId || ''}
                label="Show Tasks For User"
                onChange={handleUserChange}
                sx={{ fontSize: '0.875rem' }}
                startAdornment={<PersonIcon fontSize="small" sx={{ mr: 1, ml: -0.5, color: 'text.secondary' }} />}
                renderValue={(value) => value ? getUserName(value as string) : "All Users"}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    }
                  }
                }}
              >
                <MenuItem value="" sx={{ p: 0 }}>
                  <Box sx={{ p: 2, width: '100%' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search users..."
                      variant="outlined"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem value="">
                  <em>All Users</em>
                </MenuItem>
                {usersLoading ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 1 }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2">Loading users...</Typography>
                    </Box>
                  </MenuItem>
                ) : filteredUsers.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>No users found</Typography>
                  </MenuItem>
                ) : (
                  filteredUsers.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            
            <Tooltip title="Refresh Tasks">
              <IconButton 
                size="small" 
                onClick={refreshTasks}
                disabled={refreshing}
                sx={{ ml: 1 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleChange}
            aria-label="task status tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minWidth: 100,
                fontSize: '0.875rem',
              },
              '& .Mui-selected': {
                color: primaryColor,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: primaryColor,
              },
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">Pending</Typography>
                  <Chip 
                    label={pendingTasks.length} 
                    size="small" 
                    sx={{ ml: 1, height: 20, minWidth: 20 }} 
                  />
                </Box>
              } 
              {...a11yProps(0)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">In Progress</Typography>
                  <Chip 
                    label={inProgressTasks.length} 
                    size="small" 
                    sx={{ ml: 1, height: 20, minWidth: 20 }} 
                  />
                </Box>
              } 
              {...a11yProps(1)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">Completed</Typography>
                  <Chip 
                    label={completedTasks.length} 
                    size="small" 
                    sx={{ ml: 1, height: 20, minWidth: 20 }} 
                  />
                </Box>
              } 
              {...a11yProps(2)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">Overdue</Typography>
                  <Chip 
                    label={overdueTasks.length} 
                    size="small" 
                    sx={{ ml: 1, height: 20, minWidth: 20 }} 
                  />
                </Box>
              } 
              {...a11yProps(3)} 
            />
          </Tabs>
        </Box>
        
        <DialogContent 
          sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column',
            maxHeight: '60vh',
            minHeight: '300px',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {(isLoading || refreshing) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
              <CircularProgress size={40} sx={{ color: primaryColor, mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {refreshing ? 'Refreshing tasks...' : 'Loading tasks...'}
              </Typography>
            </Box>
          ) : tasks.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', p: 3 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                No tasks found
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                {viewMode === 'my' 
                  ? "You don't have any assigned tasks. Try switching to 'All Tasks' view."
                  : viewMode === 'user' && selectedUserId
                  ? `${getUserName(selectedUserId)} doesn't have any assigned tasks.`
                  : "There are no tasks in the system. Try creating a new task."}
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 2, color: primaryColor, borderColor: primaryColor }}
                onClick={refreshTasks}
              >
                Refresh
              </Button>
            </Box>
          ) : (
            <>
              <TabPanel value={tabValue} index={0}>
                {viewMode === 'user' && selectedUserId && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      icon={<PersonIcon fontSize="small" />}
                      label={`Viewing ${getUserName(selectedUserId)}'s tasks`}
                      color="primary"
                      size="small"
                      sx={{ 
                        bgcolor: alpha(primaryColor, 0.9), 
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    <Button 
                      size="small" 
                      onClick={() => {
                        setSelectedUserId(null);
                        setViewMode('all');
                      }}
                      variant="text"
                      sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', ml: 1 }}
                    >
                      Clear filter
                    </Button>
                  </Box>
                )}
                {pendingTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No pending tasks{viewMode === 'user' && selectedUserId ? ` for ${getUserName(selectedUserId)}` : ''}.
                  </Typography>
                ) : (
                  <List sx={{ width: '100%', p: 0 }}>
                    {pendingTasks.map(task => renderTask(task))}
                  </List>
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                {viewMode === 'user' && selectedUserId && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      icon={<PersonIcon fontSize="small" />}
                      label={`Viewing ${getUserName(selectedUserId)}'s tasks`}
                      color="primary"
                      size="small"
                      sx={{ 
                        bgcolor: alpha(primaryColor, 0.9), 
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    <Button 
                      size="small" 
                      onClick={() => {
                        setSelectedUserId(null);
                        setViewMode('all');
                      }}
                      variant="text"
                      sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', ml: 1 }}
                    >
                      Clear filter
                    </Button>
                  </Box>
                )}
                {inProgressTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No in-progress tasks{viewMode === 'user' && selectedUserId ? ` for ${getUserName(selectedUserId)}` : ''}.
                  </Typography>
                ) : (
                  <List sx={{ width: '100%', p: 0 }}>
                    {inProgressTasks.map(task => renderTask(task))}
                  </List>
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                {viewMode === 'user' && selectedUserId && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      icon={<PersonIcon fontSize="small" />}
                      label={`Viewing ${getUserName(selectedUserId)}'s tasks`}
                      color="primary"
                      size="small"
                      sx={{ 
                        bgcolor: alpha(primaryColor, 0.9), 
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    <Button 
                      size="small" 
                      onClick={() => {
                        setSelectedUserId(null);
                        setViewMode('all');
                      }}
                      variant="text"
                      sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', ml: 1 }}
                    >
                      Clear filter
                    </Button>
                  </Box>
                )}
                {completedTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No completed tasks{viewMode === 'user' && selectedUserId ? ` for ${getUserName(selectedUserId)}` : ''}.
                  </Typography>
                ) : (
                  <List sx={{ width: '100%', p: 0 }}>
                    {completedTasks.map(task => renderTask(task))}
                  </List>
                )}
              </TabPanel>
              
              <TabPanel value={tabValue} index={3}>
                {viewMode === 'user' && selectedUserId && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      icon={<PersonIcon fontSize="small" />}
                      label={`Viewing ${getUserName(selectedUserId)}'s tasks`}
                      color="primary"
                      size="small"
                      sx={{ 
                        bgcolor: alpha(primaryColor, 0.9), 
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    <Button 
                      size="small" 
                      onClick={() => {
                        setSelectedUserId(null);
                        setViewMode('all');
                      }}
                      variant="text"
                      sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', ml: 1 }}
                    >
                      Clear filter
                    </Button>
                  </Box>
                )}
                {overdueTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No overdue tasks{viewMode === 'user' && selectedUserId ? ` for ${getUserName(selectedUserId)}` : ''}.
                  </Typography>
                ) : (
                  <List sx={{ width: '100%', p: 0 }}>
                    {overdueTasks.map(task => renderTask(task))}
                  </List>
                )}
              </TabPanel>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
          <Button
            onClick={onClose}
            color="inherit"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Menu for task actions */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={() => {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (task) handleDeleteTask(task);
          }}
          sx={{ color: theme.palette.error.main }}
        >
          <ListItemText>Delete Task</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Confirmation dialog for task deletion */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this task?
            {taskToDelete && (
              <Box component="span" sx={{ fontWeight: 'bold', display: 'block', mt: 1 }}>
                "{taskToDelete.title}"
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            color="inherit"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteTask} 
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskManagementDialog; 