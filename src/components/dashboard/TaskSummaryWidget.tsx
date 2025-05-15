import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  CircularProgress,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import { 
  TaskOutlined as TaskIcon,
  AccessTime as PendingIcon,
  CheckCircleOutline as CompletedIcon,
  ErrorOutline as OverdueIcon,
  DirectionsRun as InProgressIcon,
  ArrowForwardIos as ArrowIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

type TaskSummaryProps = {
  title: string;
  filter: string; // "assignedToMe" or "assignedByMe" or empty string for all tasks
  showViewAll?: boolean;
};

const TaskSummaryWidget: React.FC<TaskSummaryProps> = ({ 
  title, 
  filter,
  showViewAll = true
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const theme = useTheme();
  const router = useRouter();
  
  // Colors based on the color scheme
  const orangeColor = '#F26722'; // Primary color
  const lightOrange = '#FFF1E8';
  const tealColor = '#19ac8b';  // Secondary color
  const lightTeal = '#e6f7f4';

  useEffect(() => {
    const fetchTaskSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query string based on filter
        const queryParams = new URLSearchParams();
        if (filter) {
          queryParams.append('assignment', filter);
        }

        // Fetch task summary from API
        const response = await fetch(`/api/dashboard/tasks/summary?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch task summary');
        }

        const data = await response.json();
        
        if (data.success) {
          setSummary(data.summary);
        } else {
          throw new Error(data.message || 'Failed to fetch task summary');
        }
      } catch (err: any) {
        console.error('Error fetching task summary:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskSummary();
  }, [filter]);

  const handleViewAll = () => {
    const queryParams = new URLSearchParams();
    if (filter) {
      queryParams.append('assignment', filter);
    }
    router.push(`/dashboard/tasks?${queryParams.toString()}`);
  };

  return (
    <Card sx={{ 
      height: '100%',
      borderRadius: 2,
      boxShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.25) 0px 20px 40px -4px'
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 4, height: 24, bgcolor: orangeColor, mr: 1.5, borderRadius: 4 }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: '#333' }}>
              {title}
            </Typography>
          </Box>
          {summary.overdue > 0 && (
            <Chip 
              icon={<OverdueIcon fontSize="small" />} 
              label={`${summary.overdue} Overdue`} 
              color="error" 
              size="small"
              sx={{ 
                fontWeight: 500, 
                px: 1,
                '& .MuiChip-icon': { 
                  fontSize: '1rem',
                  mr: 0.5 
                } 
              }}
            />
          )}
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} sx={{ color: orangeColor }} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ my: 2.5, textAlign: 'center' }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mt: 1 }}>
            {/* Total Tasks */}
            <Box sx={{ 
              flex: '1 1 calc(25% - 16px)', 
              minWidth: '120px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              bgcolor: lightOrange,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(242, 103, 34, 0.12)' }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'white', 
                borderRadius: '50%',
                p: 1,
                width: 52,
                height: 52,
                mb: 1,
                border: `1px solid ${orangeColor}`,
                boxShadow: '0 2px 8px rgba(242, 103, 34, 0.15)'
              }}>
                <TaskIcon sx={{ color: orangeColor }} fontSize="medium" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Total</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: orangeColor }}>{summary.total}</Typography>
            </Box>
            
            {/* Pending Tasks */}
            <Box sx={{ 
              flex: '1 1 calc(25% - 16px)', 
              minWidth: '120px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              bgcolor: lightOrange,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(242, 103, 34, 0.12)' }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: orangeColor, 
                borderRadius: '50%',
                p: 1,
                width: 52,
                height: 52,
                mb: 1,
                boxShadow: '0 2px 8px rgba(242, 103, 34, 0.25)'
              }}>
                <PendingIcon sx={{ color: '#fff' }} fontSize="medium" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Pending</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: orangeColor }}>{summary.pending}</Typography>
            </Box>
            
            {/* In Progress Tasks */}
            <Box sx={{ 
              flex: '1 1 calc(25% - 16px)', 
              minWidth: '120px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              bgcolor: lightTeal,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(25, 172, 139, 0.12)' }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: tealColor, 
                borderRadius: '50%',
                p: 1,
                width: 52,
                height: 52,
                mb: 1,
                boxShadow: '0 2px 8px rgba(25, 172, 139, 0.25)'
              }}>
                <InProgressIcon sx={{ color: '#fff' }} fontSize="medium" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>In Progress</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: tealColor }}>{summary.inProgress}</Typography>
            </Box>
            
            {/* Completed Tasks */}
            <Box sx={{ 
              flex: '1 1 calc(25% - 16px)', 
              minWidth: '120px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              bgcolor: lightTeal,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(25, 172, 139, 0.12)' }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: tealColor, 
                borderRadius: '50%',
                p: 1,
                width: 52,
                height: 52,
                mb: 1,
                boxShadow: '0 2px 8px rgba(25, 172, 139, 0.25)'
              }}>
                <CompletedIcon sx={{ color: '#fff' }} fontSize="medium" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Completed</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: tealColor }}>{summary.completed}</Typography>
            </Box>
          </Box>
        )}

        {showViewAll && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              endIcon={<ArrowIcon fontSize="small" />} 
              onClick={handleViewAll}
              size="small"
              sx={{ 
                fontWeight: 500,
                color: tealColor,
                '&:hover': {
                  backgroundColor: lightTeal,
                  transform: 'translateX(4px)'
                },
                transition: 'transform 0.2s',
                px: 2
              }}
            >
              View All Tasks
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskSummaryWidget; 