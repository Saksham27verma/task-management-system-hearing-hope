'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import TaskList from '@/components/tasks/TaskList';
import { useAuth } from '@/contexts/AuthContext';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch tasks from the API
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/tasks');
        
        if (!response.ok) {
          throw new Error(`Failed to load tasks: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Tasks loaded successfully:', data.tasks);
          setTasks(data.tasks);
        } else {
          throw new Error(data.message || 'Failed to load tasks');
        }
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        setError(err.message || 'Failed to load tasks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleTaskEdit = (id: string) => {
    router.push(`/dashboard/tasks/${id}/edit`);
  };

  const handleTaskUpdate = (id: string) => {
    router.push(`/dashboard/tasks/${id}/update`);
  };

  const handleCreateTask = () => {
    router.push('/dashboard/tasks/create');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>
        
        {/* Only show Create Task button for managers and admins */}
        {user && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
          >
            Create Task
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TaskList />
    </Box>
  );
} 