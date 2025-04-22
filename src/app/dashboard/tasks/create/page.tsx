'use client';

import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import TaskForm from '@/components/tasks/TaskForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function CreateTaskPage() {
  const router = useRouter();
  
  const handleSubmit = (success: boolean) => {
    if (success) {
      router.push('/dashboard/tasks');
    }
  };
  
  const handleCancel = () => {
    router.push('/dashboard/tasks');
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Link href="/dashboard/tasks" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
          <ArrowBackIcon sx={{ mr: 1 }} />
          <Typography variant="body1">Back to Tasks</Typography>
        </Link>
      </Box>
      
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h5" fontWeight="medium">Create New Task</Typography>
        </Box>
        
        <Box sx={{ p: 0 }}>
          <TaskForm onSubmit={handleSubmit} onCancel={handleCancel} />
        </Box>
      </Paper>
    </Container>
  );
} 