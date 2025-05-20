import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/Task';
import { useTask } from '@/contexts/TaskContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  List,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import TaskItem from './TaskItem';

interface TaskListProps {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToUser?: boolean;
  emptyMessage?: string;
  maxTasks?: number;
}

const TaskList: React.FC<TaskListProps> = ({
  title = 'Tasks',
  status,
  priority,
  assignedToUser = false,
  emptyMessage = 'No tasks found',
  maxTasks = 10
}) => {
  const { tasks, isLoading, error, fetchTasks } = useTask();
  const { user } = useAuth();
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  // Filter tasks based on props
  useEffect(() => {
    if (!tasks || !user) {
      setFilteredTasks([]);
      return;
    }

    let result = [...tasks];

    // Filter by status if provided
    if (status) {
      result = result.filter(task => task.status === status);
    }

    // Filter by priority if provided
    if (priority) {
      result = result.filter(task => task.priority === priority);
    }

    // Filter by assigned to current user if requested
    if (assignedToUser) {
      result = result.filter(task => 
        task.assignedTo && task.assignedTo.includes(user.id)
      );
    }

    // Sort by priority (high first) and then by due date (closest first)
    result.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                           priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // Limit the number of tasks if maxTasks is provided
    if (maxTasks > 0) {
      result = result.slice(0, maxTasks);
    }

    setFilteredTasks(result);
  }, [tasks, status, priority, assignedToUser, user, maxTasks]);

  // Refresh tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" fontWeight="medium">
          {title}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ 
        p: 0, 
        overflow: 'auto', 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isLoading || error || filteredTasks.length === 0 ? 'center' : 'flex-start'
      }}>
        {isLoading ? (
          <CircularProgress size={40} sx={{ my: 4 }} />
        ) : error ? (
          <Alert severity="error" sx={{ m: 2, width: '90%' }}>{error}</Alert>
        ) : filteredTasks.length === 0 ? (
          <Typography color="text.secondary" sx={{ my: 4 }}>
            {emptyMessage}
          </Typography>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {filteredTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default TaskList; 