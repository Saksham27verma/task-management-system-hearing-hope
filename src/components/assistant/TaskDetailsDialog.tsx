import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  Alert,
  useTheme,
  List,
  Paper,
} from '@mui/material';
import { 
  Close as CloseIcon,
  AccessTime as AccessTimeIcon, 
  Person as PersonIcon,
  Flag as FlagIcon,
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { Task } from '@/types/Task';
import { User } from '@/types/User';
import { formatDate } from '@/utils/dates';

// Define a type for progress updates
interface ProgressUpdate {
  id: string;
  date: Date;
  progress: number;
  remarks: string;
}

interface TaskDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  taskId?: string;
  userId?: string;
  tasks: Task[];
  users: User[];
}

const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({ 
  open, 
  onClose, 
  taskId, 
  userId,
  tasks,
  users
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for progress updates history (mocked for now)
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);

  // Find task details when dialog opens
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (open && taskId) {
        setLoading(true);
        try {
          // First, check if the task is in our local tasks array
          const foundTask = tasks.find(t => t.id === taskId);
          if (foundTask) {
            setTask(foundTask);
            console.log('Task found in local state:', foundTask);
            
            // Now fetch the complete task with progress updates directly from API
            const response = await fetch(`/api/tasks/${foundTask.id}`);
            if (response.ok) {
              const data = await response.json();
              console.log('API task details:', data);
              
              if (data.task && data.task.progressUpdates) {
                // Create progress updates from the API response
                const apiTask = data.task;
                const updates: ProgressUpdate[] = [];
                
                // Add task creation as first update
                updates.push({
                  id: 'task-created',
                  date: new Date(foundTask.createdAt || Date.now()),
                  progress: 0,
                  remarks: 'Task created'
                });
                
                // Add all progress updates from the API response
                if (apiTask.progressUpdates && Array.isArray(apiTask.progressUpdates)) {
                  apiTask.progressUpdates.slice(0).reverse().forEach((update: any, index: number) => {
                    updates.push({
                      id: `progress-${index}`,
                      date: new Date(update.date),
                      progress: 50,
                      remarks: update.progress // The actual update text is in the "progress" field
                    });
                  });
                }
                
                // Add completion update if task is completed
                if (apiTask.status === 'COMPLETED' || foundTask.status === 'completed') {
                  updates.push({
                    id: 'completion',
                    date: new Date(apiTask.updatedAt || foundTask.updatedAt),
                    progress: 100,
                    remarks: apiTask.remarks || foundTask.remarks || 'Task completed'
                  });
                }
                
                console.log('Progress updates created:', updates);
                setProgressUpdates(updates);
              }
            }
          } else {
            setError(`Task with ID "${taskId}" not found. Please try specifying a valid task name or ID.`);
            setTask(null);
          }
        } catch (error) {
          console.error('Error in fetchTaskDetails:', error);
          setError(`Error fetching task details: ${error.message}`);
          setTask(null);
        } finally {
          setLoading(false);
        }
      } else if (open && !taskId) {
        setError('No task specified. Please select a specific task to view its details.');
        setTask(null);
      } else {
        setTask(null);
        setError(null);
      }
    };
    
    fetchTaskDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId, tasks]);

  // Get assigned user details
  const getAssignedUserName = () => {
    if (!task) return 'Unknown';
    
    // Handle array of assignees
    if (Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
      const assignedUser = users.find(user => user.id === task.assignedTo[0]);
      return assignedUser ? assignedUser.name : 'Unassigned';
    }
    
    return 'Unassigned';
  };

  // Get username by ID
  const getUsernameById = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Priority label and color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  // Format status
  const getStatusChip = () => {
    if (!task) return null;
    
    let color = 'default';
    const statusKey = task.status?.toLowerCase();
    
    switch (statusKey) {
      case 'completed': color = 'success'; break;
      case 'in-progress': color = 'info'; break;
      case 'pending': color = 'warning'; break;
      case 'overdue': color = 'error'; break;
    }
    
    return (
      <Chip 
        size="small" 
        label={task.status || 'Unknown'} 
        color={color as any} 
        sx={{ fontSize: '0.75rem' }}
      />
    );
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDark ? '#1e1e1e' : '#fff',
          color: isDark ? '#fff' : '#333',
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
      }}>
        <Typography variant="h6">
          Task Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {task ? (
          <Box>
            <Typography variant="h5" gutterBottom>
              {task.title}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {getStatusChip()}
              <Chip 
                size="small"
                icon={<FlagIcon sx={{ fontSize: '0.875rem !important' }} />}
                label={task.priority || 'Normal'}
                sx={{ 
                  bgcolor: `${getPriorityColor(task.priority || 'normal')}22`,
                  color: getPriorityColor(task.priority || 'normal'),
                  fontSize: '0.75rem'
                }}
              />
            </Box>
            
            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
              {task.description}
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="action" fontSize="small" />
                <Typography variant="body2">
                  <strong>Assigned to:</strong> {getAssignedUserName()}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="action" fontSize="small" />
                <Typography variant="body2">
                  <strong>Due:</strong> {task.dueDate ? formatDate(new Date(task.dueDate)) : 'No deadline'}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Progress Updates Section */}
            <Typography variant="h6" sx={{ 
              mb: 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}>
              <HistoryIcon fontSize="small" />
              Progress Updates & Completion Remarks
            </Typography>
            
            {progressUpdates.length > 0 ? (
              <List sx={{ padding: 0 }}>
                {progressUpdates.map((update, index) => (
                  <Paper
                    key={update.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      borderRadius: 2,
                      borderLeft: '4px solid',
                      borderLeftColor: update.progress === 100 
                        ? 'success.main' 
                        : 'primary.main',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1 
                      }}>
                        {update.progress === 100 ? (
                          <>
                            <CheckCircleIcon fontSize="small" color="success" />
                            Completion Remarks
                          </>
                        ) : (
                          <>
                            <UpdateIcon fontSize="small" color="primary" />
                            {update.id === 'task-created' ? 'Task Created' : 'Progress Update'}
                          </>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {update.date.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" sx={{ my: 1 }}>
                      {update.remarks && (
                        update.remarks.includes('<') && update.remarks.includes('>')
                          ? <div dangerouslySetInnerHTML={{ __html: update.remarks }} />
                          : update.remarks.includes('[COMPLETION REVOKED BY ADMIN]')
                            ? <Box>
                                <Typography color="error.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  Task completion was revoked by an administrator
                                </Typography>
                                {update.remarks}
                              </Box>
                            : update.remarks
                      )}
                    </Typography>
                    
                    {update.progress === 100 && (
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={update.progress} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" align="right" sx={{ display: 'block', mt: 0.5 }}>
                          Progress: 100% (Complete)
                        </Typography>
                      </Box>
                    )}
                    
                    {update.id === 'completion' && (
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
                        borderRadius: 1,
                        borderLeft: '3px solid',
                        borderColor: 'success.main' 
                      }}>
                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                          Completion Remarks:
                        </Typography>
                        <Typography variant="body2">
                          {update.remarks || "Task completed successfully"}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                      <Typography variant="caption" color="text.secondary">
                        {update.id === 'task-created' 
                          ? `Created by ${getUsernameById(task.createdBy)}`
                          : `Updated by ${Array.isArray(task.assignedTo) && task.assignedTo.length > 0 
                              ? getUsernameById(task.assignedTo[0]) 
                              : getUsernameById(task.createdBy)}`
                        }
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                No progress updates available for this task.
              </Typography>
            )}
          </Box>
        ) : (
          <Typography>
            {error || 'Select a task to view details'}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          size="small"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailsDialog; 