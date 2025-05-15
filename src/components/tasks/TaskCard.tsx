'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDateHuman, isDatePast, getDaysRemaining } from '@/utils/dates';
import { useAuth } from '@/contexts/AuthContext';

// Define theme colors
const ORANGE_COLOR = '#F26722';
const TEAL_COLOR = '#19ac8b';
const LIGHT_ORANGE = '#FFF1E8';
const LIGHT_TEAL = '#e6f7f4';

// Status color mapping
const statusColors: Record<string, string> = {
  PENDING: ORANGE_COLOR, // Orange
  IN_PROGRESS: TEAL_COLOR, // Teal
  COMPLETED: TEAL_COLOR, // Teal
  DELAYED: '#e74a3b', // Red
  INCOMPLETE: '#e74a3b', // Red
};

// Task type badges
const taskTypeBadges: Record<string, { label: string; color: string }> = {
  DAILY: { label: 'Daily', color: ORANGE_COLOR },
  WEEKLY: { label: 'Weekly', color: TEAL_COLOR },
  MONTHLY: { label: 'Monthly', color: '#6c757d' }, // Grey for contrast
  DAILY_RECURRING: { label: 'Daily Recurring', color: '#ff9800' }, // Orange variation
  WEEKLY_RECURRING: { label: 'Weekly Recurring', color: '#00bcd4' }, // Teal variation
  MONTHLY_RECURRING: { label: 'Monthly Recurring', color: '#9e9e9e' }, // Grey variation
};

// Progress calculation for weekly/monthly tasks
const calculateProgress = (updates: any[]): number => {
  if (!updates || updates.length === 0) return 0;
  return Math.min(100, Math.round((updates.length / 30) * 100)); // Simplified calculation
};

interface TaskCardProps {
  task: {
    _id: string;
    title: string;
    description: string;
    taskType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'DAILY_RECURRING' | 'WEEKLY_RECURRING' | 'MONTHLY_RECURRING';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'INCOMPLETE';
    dueDate: string;
    assignedTo: {
      _id: string;
      name: string;
    };
    assignedBy: {
      _id: string;
      name: string;
    };
    progressUpdates: any[];
    remarks?: string;
  };
  onEdit?: (id: string) => void;
  onUpdate?: (id: string) => void;
}

export default function TaskCard({ task, onEdit, onUpdate }: TaskCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = user?.id === task.assignedTo._id;
  const isAssigner = user?.id === task.assignedBy._id;
  const canEdit = isAssigner || user?.role === 'SUPER_ADMIN';
  
  // Check if task is due soon (3 days or less)
  const dueSoon = getDaysRemaining(new Date(task.dueDate)) <= 3 && task.status !== 'COMPLETED';
  
  // Check if task is overdue
  const isOverdue = isDatePast(new Date(task.dueDate)) && task.status !== 'COMPLETED';
  
  // Format description to show only first 120 characters
  const shortDescription = task.description.length > 120 
    ? `${task.description.slice(0, 120)}...` 
    : task.description;
  
  // Handle view task details
  const handleViewTask = () => {
    router.push(`/dashboard/tasks/${task._id}`);
  };
  
  // Handle update task progress
  const handleUpdateProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
      onUpdate(task._id);
    } else {
      router.push(`/dashboard/tasks/${task._id}/update`);
    }
  };
  
  // Handle edit task
  const handleEditTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(task._id);
    } else {
      router.push(`/dashboard/tasks/${task._id}/edit`);
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer', 
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
        },
        borderLeft: `4px solid ${statusColors[task.status]}`,
        borderRadius: 2,
      }}
      onClick={handleViewTask}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Chip 
            icon={<AssignmentIcon />} 
            label={taskTypeBadges[task.taskType].label} 
            size="small"
            sx={{ 
              backgroundColor: taskTypeBadges[task.taskType].color,
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Chip 
            label={task.status.replace('_', ' ')} 
            size="small"
            sx={{ 
              backgroundColor: statusColors[task.status],
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>

        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {task.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {shortDescription}
        </Typography>
        
        {task.taskType !== 'DAILY' && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {calculateProgress(task.progressUpdates)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={calculateProgress(task.progressUpdates)} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: task.status === 'COMPLETED' ? LIGHT_TEAL : LIGHT_ORANGE,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: task.status === 'COMPLETED' ? TEAL_COLOR : ORANGE_COLOR
                }
              }}
            />
          </Box>
        )}
        
        <Divider sx={{ my: 1.5 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Due Date">
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <TimeIcon fontSize="small" color={isOverdue ? 'error' : dueSoon ? 'warning' : 'action'} sx={{ mr: 0.5 }} />
                <Typography 
                  variant="body2" 
                  color={isOverdue ? 'error.main' : dueSoon ? 'warning.main' : 'text.secondary'}
                >
                  {formatDateHuman(new Date(task.dueDate))}
                </Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title="Assigned To">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {task.assignedTo.name}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          
          {task.remarks && (
            <Tooltip title="Has Remarks">
              <CommentIcon fontSize="small" color="action" />
            </Tooltip>
          )}
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Button 
          size="small" 
          sx={{ 
            color: TEAL_COLOR,
            '&:hover': {
              backgroundColor: LIGHT_TEAL
            }
          }}
          onClick={handleViewTask}
        >
          View Details
        </Button>
        
        <Box>
          {isOwner && task.status !== 'COMPLETED' && (
            <Button 
              size="small" 
              sx={{ 
                color: ORANGE_COLOR,
                '&:hover': {
                  backgroundColor: LIGHT_ORANGE
                }
              }}
              onClick={handleUpdateProgress}
            >
              Update Progress
            </Button>
          )}
          
          {canEdit && (
            <IconButton 
              size="small" 
              onClick={handleEditTask}
              sx={{ 
                ml: 1,
                color: ORANGE_COLOR,
                '&:hover': {
                  backgroundColor: LIGHT_ORANGE
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardActions>
    </Card>
  );
} 