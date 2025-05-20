import React from 'react';
import { Task } from '@/types/Task';
import { 
  ListItem, 
  ListItemText, 
  Typography, 
  Box, 
  Chip, 
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  AccessTime as TimeIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { formatDistance } from 'date-fns';
import { useTask } from '@/contexts/TaskContext';

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { updateTask, deleteTask } = useTask();
  
  // Format the due date
  const formattedDueDate = formatDistance(
    new Date(task.dueDate), 
    new Date(), 
    { addSuffix: true }
  );
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'info';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#d32f2f';
      case 'medium': return '#ed6c02';
      case 'low': return '#0288d1';
      default: return 'gray';
    }
  };
  
  // Handle marking task as completed
  const handleComplete = () => {
    updateTask(task.id, { 
      status: 'completed',
      updatedAt: new Date()
    });
  };
  
  // Handle deleting task
  const handleDelete = () => {
    deleteTask(task.id);
  };
  
  return (
    <>
      <ListItem
        alignItems="flex-start"
        sx={{ 
          py: 2,
          px: 3,
          borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
          '&:hover': {
            bgcolor: (theme) => 
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
          }
        }}
        secondaryAction={
          <Box>
            <Tooltip title="Mark as completed">
              <IconButton 
                edge="end" 
                size="small" 
                onClick={handleComplete}
                color="success"
                disabled={task.status === 'completed'}
                sx={{ mx: 0.5 }}
              >
                <CheckIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit task">
              <IconButton 
                edge="end" 
                size="small" 
                color="primary"
                sx={{ mx: 0.5 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete task">
              <IconButton 
                edge="end" 
                size="small" 
                onClick={handleDelete}
                color="error"
                sx={{ mx: 0.5 }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      >
        <ListItemText
          primary={
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={500}>
                {task.title}
              </Typography>
              <Chip
                label={task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                color={getStatusColor(task.status) as any}
                size="small"
                sx={{ mr: 8 }}
              />
            </Box>
          }
          secondary={
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {task.description}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TimeIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Due {formattedDueDate}
                </Typography>
                <FlagIcon sx={{ ml: 2, mr: 0.5, color: getPriorityColor(task.priority), fontSize: 18 }} />
                <Typography variant="caption" color="text.secondary">
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                </Typography>
              </Box>
            </Box>
          }
        />
      </ListItem>
      <Divider component="li" />
    </>
  );
};

export default TaskItem; 