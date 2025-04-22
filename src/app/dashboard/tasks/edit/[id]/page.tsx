'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Alert, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import TaskForm from '@/components/tasks/TaskForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function EditTaskPage({ params }: any) {
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch task data
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tasks/${params.id}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setTask(data.task);
        } else {
          setError(data.message || 'Failed to fetch task details');
        }
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('An error occurred while fetching task details');
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchTaskData();
    }
  }, [params.id]);
  
  const handleSubmit = (success: boolean) => {
    if (success) {
      router.push(`/dashboard/tasks/${params.id}`);
    }
  };
  
  const handleCancel = () => {
    router.push(`/dashboard/tasks/${params.id}`);
  };
  
  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Link href="/dashboard/tasks" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
            <ArrowBackIcon sx={{ mr: 1 }} />
            <Typography variant="body1">Back to Tasks</Typography>
          </Link>
        </Box>
      </Container>
    );
  }
  
  // Not found state
  if (!task) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Task not found
        </Alert>
        <Box sx={{ mt: 3 }}>
          <Link href="/dashboard/tasks" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
            <ArrowBackIcon sx={{ mr: 1 }} />
            <Typography variant="body1">Back to Tasks</Typography>
          </Link>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Link href={`/dashboard/tasks/${params.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
          <ArrowBackIcon sx={{ mr: 1 }} />
          <Typography variant="body1">Back to Task Details</Typography>
        </Link>
      </Box>
      
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h5">Edit Task</Typography>
        </Box>
        
        <TaskForm 
          task={task} 
          onSubmit={handleSubmit} 
          onCancel={handleCancel} 
        />
      </Paper>
    </Container>
  );
} 