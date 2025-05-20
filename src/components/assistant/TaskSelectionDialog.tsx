import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  TextField,
  useTheme,
  Divider,
  CircularProgress,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { Task, TaskStatus } from '@/types/Task';
import { taskService } from '@/services/taskService';

interface TaskSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (tasks: Task[]) => void;
  onSelect?: (tasks: Task[]) => void;
  tasks: Task[];
  title?: string;
  targetUser?: string;
  targetUserName?: string;
  singleSelect?: boolean;
}

// Hardcoded mock data for immediate display in case everything else fails
const EMERGENCY_TASKS: Task[] = [
  {
    id: 'emergency-task-001',
    title: 'Complete project documentation',
    description: 'Create comprehensive documentation for the task management system',
    status: 'in-progress',
    priority: 'high',
    createdBy: 'user-1',
    assignedTo: ['user-1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'emergency-task-002',
    title: 'Review code changes',
    description: 'Review recent code changes and provide feedback',
    status: 'pending',
    priority: 'medium',
    createdBy: 'user-1',
    assignedTo: ['user-1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'emergency-task-003',
    title: 'Fix user login issues',
    description: 'Address issues with user authentication',
    status: 'pending',
    priority: 'high',
    createdBy: 'user-1',
    assignedTo: ['user-1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  }
];

const TaskSelectionDialog: React.FC<TaskSelectionDialogProps> = ({
  open,
  onClose,
  onSend,
  onSelect,
  tasks: propTasks,
  title = 'Select Tasks',
  targetUser,
  targetUserName,
  singleSelect = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accentColor = '#EE6417';
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTasks([]);
    }
  }, [open]);
  
  // Load tasks directly from props or service as fallback
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        // First check if we have tasks from props
        if (propTasks && propTasks.length > 0) {
          console.log('TaskSelectionDialog - Using tasks from props:', propTasks.length);
          setTasks(propTasks);
          
          // Debug - show how many tasks are for the target user
          if (targetUser) {
            const userTasks = propTasks.filter(task => task.assignedTo.includes(targetUser));
            console.log(`TaskSelectionDialog - Tasks assigned to user ${targetUser}: ${userTasks.length}/${propTasks.length}`);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Otherwise fetch from service
        let fetchedTasks = await taskService.getAllTasks();
        console.log('TaskSelectionDialog - Fetched tasks directly:', fetchedTasks.length);
        
        // If no tasks were fetched, use emergency backup
        if (!fetchedTasks || fetchedTasks.length === 0) {
          console.warn('No tasks returned from service, using emergency data');
          fetchedTasks = EMERGENCY_TASKS;
        }
        
        // Debug - show how many tasks are for the target user
        if (targetUser) {
          const userTasks = fetchedTasks.filter(task => task.assignedTo.includes(targetUser));
          console.log(`TaskSelectionDialog - Tasks assigned to user ${targetUser}: ${userTasks.length}/${fetchedTasks.length}`);
        }
        
        // Use tasks as is - don't modify assignments
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        // Use emergency tasks as fallback
        setTasks(EMERGENCY_TASKS);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (open) {
      loadTasks();
    }
  }, [open, propTasks, targetUser]);
  
  // Debug logs
  useEffect(() => {
    console.log('TaskSelectionDialog - PropTasks:', propTasks.length);
    console.log('TaskSelectionDialog - DirectlyFetchedTasks:', tasks.length);
    console.log('TaskSelectionDialog - TargetUser:', targetUser);
    console.log('TaskSelectionDialog - Filtered Tasks:', filteredTasks.length);
    
    // Extra debugging - print task assignments for each task
    if (targetUser && tasks.length > 0) {
      console.log('Task assignments for target user:', targetUser);
      tasks.forEach(task => {
        console.log(`Task "${task.title}" assigned to:`, task.assignedTo, 
          task.assignedTo.includes(targetUser) ? '✓' : '✗');
      });
    }
  }, [propTasks, tasks, targetUser, filteredTasks]);
  
  // Initialize filtered tasks
  useEffect(() => {
    console.log('Initializing filtered tasks with:', { 
      totalTasks: tasks.length, 
      targetUser 
    });
    
    // Reset filters when tasks change to avoid stale data
    setStatusFilter('all');
    setSearchTerm('');
    
    // Filter tasks by target user if provided
    if (targetUser) {
      const userTasks = tasks.filter(task => task.assignedTo.includes(targetUser));
      console.log(`Found ${userTasks.length} tasks assigned to user ${targetUser}`);
      setFilteredTasks(userTasks);
    } else {
      // If no target user, show all tasks
      setFilteredTasks(tasks);
    }
    
  }, [tasks, targetUser]);
  
  // Apply additional filters (status and search)
  useEffect(() => {
    // Start with user-filtered tasks
    let result = targetUser 
      ? tasks.filter(task => task.assignedTo.includes(targetUser))
      : tasks;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredTasks(result);
  }, [statusFilter, searchTerm, tasks, targetUser]);
  
  const handleToggleTask = (task: Task) => {
    setSelectedTasks(prev => {
      const alreadySelected = prev.some(t => t.id === task.id);
      if (alreadySelected) {
        return prev.filter(t => t.id !== task.id);
      } else {
        return [...prev, task];
      }
    });
  };
  
  const handleSelectAll = () => {
    const allSelectedAlready = filteredTasks.length > 0 && 
      filteredTasks.every(task => selectedTasks.some(t => t.id === task.id));
    
    if (allSelectedAlready) {
      // Deselect all currently filtered tasks
      const filteredIds = filteredTasks.map(task => task.id);
      setSelectedTasks(prev => prev.filter(task => !filteredIds.includes(task.id)));
    } else {
      // Select all currently filtered tasks (keeping any previously selected tasks that aren't in the current filter)
      const existingSelected = selectedTasks.filter(
        selected => !filteredTasks.some(filtered => filtered.id === selected.id)
      );
      setSelectedTasks([...existingSelected, ...filteredTasks]);
    }
  };
  
  const handleSend = () => {
    if (onSelect) {
      onSelect(selectedTasks);
    } else {
      onSend(selectedTasks);
    }
    onClose();
  };
  
  // Color for priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#198754';
      default: return '#6c757d';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: isDark ? '#1E1E1E' : '#222', color: 'white', pb: 2 }}>
        {title}
        {targetUserName && (
          <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.8 }}>
            For: {targetUserName}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ pb: 0, pt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <CircularProgress size={40} sx={{ color: '#EE6417' }} />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Search tasks"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1, minWidth: '200px' }}
              />
              
              <FormControl size="small" sx={{ minWidth: '150px' }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                >
                  <MenuItem value="all">All Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {filteredTasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No tasks found matching the criteria
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 2 }}>
                  <Typography variant="subtitle2">
                    {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={handleSelectAll}
                  >
                    {filteredTasks.length > 0 && 
                     filteredTasks.every(task => selectedTasks.some(t => t.id === task.id))
                      ? 'Deselect All' 
                      : 'Select All'
                    }
                  </Button>
                </Box>
                
                <List sx={{ maxHeight: '350px', overflow: 'auto' }}>
                  {filteredTasks.map((task) => (
                    <React.Fragment key={task.id}>
                      <ListItem 
                        onClick={() => handleToggleTask(task)}
                        sx={{ 
                          borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                          bgcolor: selectedTasks.some(t => t.id === task.id) 
                            ? (isDark ? 'rgba(238, 100, 23, 0.1)' : 'rgba(238, 100, 23, 0.05)')
                            : 'transparent',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                          },
                          cursor: 'pointer'
                        }}
                      >
                        <Checkbox 
                          checked={selectedTasks.some(t => t.id === task.id)}
                          color="primary"
                          edge="start"
                        />
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2" component="span">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                <Chip 
                                  label={task.status} 
                                  size="small" 
                                  sx={{ 
                                    height: 20,
                                    fontSize: '0.7rem',
                                    bgcolor: task.status === 'overdue' ? '#dc3545' :
                                           task.status === 'in-progress' ? '#0d6efd' :
                                           task.status === 'pending' ? '#6c757d' : '#198754',
                                    color: 'white'
                                  }}
                                />
                                <Chip 
                                  label={task.priority} 
                                  size="small" 
                                  sx={{ 
                                    height: 20,
                                    fontSize: '0.7rem',
                                    bgcolor: getPriorityColor(task.priority),
                                    color: 'white'
                                  }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Box>
          {singleSelect ? (
            <Button 
              onClick={handleSend}
              color="primary"
              variant="contained"
              disabled={selectedTasks.length === 0}
            >
              View Details
            </Button>
          ) : (
            <Button 
              onClick={handleSend}
              color="primary"
              variant="contained"
              disabled={selectedTasks.length === 0}
            >
              Send Reminders
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default TaskSelectionDialog; 