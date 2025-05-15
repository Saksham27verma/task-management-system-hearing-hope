'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  styled,
  useTheme
} from '@mui/material';
import {
  TaskAlt as CompletedIcon,
  HourglassEmpty as PendingIcon,
  Timelapse as InProgressIcon,
  WarningAmber as OverdueIcon,
  Description as TaskIcon,
  PersonOutline as UserIcon,
  SupervisorAccount as ManagerIcon,
  Person as EmployeeIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: 12,
  height: '100%',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)',
  }
}));

const StatCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
}));

const StatIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 56,
  height: 56,
  borderRadius: '50%',
  marginRight: theme.spacing(2),
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
}));

const StatContent = styled(Box)({
  flexGrow: 1,
});

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.2rem',
  fontWeight: 'bold',
  marginBottom: theme.spacing(0.5),
  lineHeight: 1.2,
}));

const ViewAllButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  alignSelf: 'flex-end',
  borderRadius: 8,
  padding: '6px 16px',
  fontWeight: 500,
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateX(5px)',
  }
}));

interface AdminDashboardCardsProps {
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
  };
  userStats: {
    total: number;
    active: number;
    managers: number;
    employees: number;
  };
}

export default function AdminDashboardCards({ taskStats, userStats }: AdminDashboardCardsProps) {
  const router = useRouter();
  const theme = useTheme();
  
  // Color definitions
  const orangeColor = '#F26722'; // Primary color
  const lightOrange = '#FFF1E8'; 
  const tealColor = '#19ac8b';  // Secondary color
  const lightTeal = '#e6f7f4';
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Task Summary */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ width: 4, height: 24, bgcolor: orangeColor, mr: 1.5, borderRadius: 4 }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: '#333' }}>Task Summary</Typography>
        </Box>
        
        {/* Task Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Total Tasks */}
          <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
            <StyledPaper sx={{ 
              bgcolor: orangeColor, 
              color: 'white',
              boxShadow: '0 4px 12px rgba(242, 103, 34, 0.15)'
            }}>
              <StatCard>
                <StatIcon sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                  <TaskIcon fontSize="large" sx={{ color: 'white' }} />
                </StatIcon>
                <StatContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, letterSpacing: '0.5px', fontWeight: 500 }}>Total Tasks</Typography>
                  <StatValue>{taskStats.total}</StatValue>
                </StatContent>
              </StatCard>
            </StyledPaper>
          </Box>
          
          {/* Completed */}
          <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
            <StyledPaper sx={{ 
              bgcolor: tealColor, 
              color: 'white',
              boxShadow: '0 4px 12px rgba(25, 172, 139, 0.15)'
            }}>
              <StatCard>
                <StatIcon sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                  <CompletedIcon fontSize="large" sx={{ color: 'white' }} />
                </StatIcon>
                <StatContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, letterSpacing: '0.5px', fontWeight: 500 }}>Completed</Typography>
                  <StatValue>{taskStats.completed}</StatValue>
                </StatContent>
              </StatCard>
            </StyledPaper>
          </Box>
          
          {/* Pending */}
          <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
            <StyledPaper sx={{ 
              bgcolor: 'white', 
              color: '#333',
              border: `1px solid ${orangeColor}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <StatCard>
                <StatIcon sx={{ bgcolor: lightOrange }}>
                  <PendingIcon fontSize="large" sx={{ color: orangeColor }} />
                </StatIcon>
                <StatContent>
                  <Typography variant="body2" sx={{ color: 'text.secondary', letterSpacing: '0.5px', fontWeight: 500 }}>Pending</Typography>
                  <StatValue sx={{ color: '#333' }}>{taskStats.pending}</StatValue>
                </StatContent>
              </StatCard>
            </StyledPaper>
          </Box>
          
          {/* In Progress */}
          <Box sx={{ flex: '1 1 calc(25% - 24px)', minWidth: '200px' }}>
            <StyledPaper sx={{ 
              bgcolor: 'white', 
              color: '#333',
              border: `1px solid ${tealColor}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <StatCard>
                <StatIcon sx={{ bgcolor: lightTeal }}>
                  <InProgressIcon fontSize="large" sx={{ color: tealColor }} />
                </StatIcon>
                <StatContent>
                  <Typography variant="body2" sx={{ color: 'text.secondary', letterSpacing: '0.5px', fontWeight: 500 }}>In Progress</Typography>
                  <StatValue sx={{ color: '#333' }}>{taskStats.inProgress}</StatValue>
                </StatContent>
              </StatCard>
            </StyledPaper>
          </Box>
        </Box>
        
        {/* Overdue Tasks - Full width */}
        <Box sx={{ mt: 3 }}>
          <StyledPaper sx={{ 
            bgcolor: orangeColor, 
            color: 'white',
            boxShadow: '0 4px 12px rgba(242, 103, 34, 0.15)'
          }}>
            <StatCard>
              <StatIcon sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                <OverdueIcon fontSize="large" sx={{ color: 'white' }} />
              </StatIcon>
              <StatContent>
                <Typography variant="body2" sx={{ opacity: 0.9, letterSpacing: '0.5px', fontWeight: 500 }}>Overdue</Typography>
                <StatValue>{taskStats.overdue}</StatValue>
              </StatContent>
            </StatCard>
          </StyledPaper>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <ViewAllButton 
            variant="outlined" 
            sx={{ 
              color: tealColor,
              borderColor: tealColor,
              '&:hover': {
                borderColor: tealColor,
                backgroundColor: lightTeal,
              }
            }}
            onClick={() => router.push('/dashboard/tasks')}
          >
            View All Tasks
          </ViewAllButton>
        </Box>
      </Box>
      
      {/* Employee Summary */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ width: 4, height: 24, bgcolor: tealColor, mr: 1.5, borderRadius: 4 }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: '#333' }}>Employee Summary</Typography>
        </Box>
        
        {/* Employee Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Total Users */}
          <Box sx={{ flex: '1 1 calc(50% - 24px)', minWidth: '240px' }}>
            <StyledPaper sx={{ 
              bgcolor: tealColor, 
              color: 'white',
              boxShadow: '0 4px 12px rgba(25, 172, 139, 0.15)'
            }}>
              <StatCard>
                <StatIcon sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                  <UserIcon fontSize="large" sx={{ color: 'white' }} />
                </StatIcon>
                <StatContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, letterSpacing: '0.5px', fontWeight: 500 }}>Total Users</Typography>
                  <StatValue>{userStats.total}</StatValue>
                </StatContent>
              </StatCard>
            </StyledPaper>
          </Box>
          
          {/* Active Users */}
          <Box sx={{ flex: '1 1 calc(50% - 24px)', minWidth: '240px' }}>
            <StyledPaper sx={{ 
              bgcolor: 'white', 
              color: '#333',
              border: `1px solid ${tealColor}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <StatCard>
                <StatIcon sx={{ bgcolor: lightTeal }}>
                  <UserIcon fontSize="large" sx={{ color: tealColor }} />
                </StatIcon>
                <StatContent>
                  <Typography variant="body2" sx={{ color: 'text.secondary', letterSpacing: '0.5px', fontWeight: 500 }}>Active Users</Typography>
                  <StatValue sx={{ color: '#333' }}>{userStats.active}</StatValue>
                </StatContent>
              </StatCard>
            </StyledPaper>
          </Box>
          
          {/* Managers */}
          <Box sx={{ flex: '1 1 calc(50% - 24px)', minWidth: '240px' }}>
            <StyledPaper sx={{ 
              bgcolor: orangeColor, 
              color: 'white',
              boxShadow: '0 4px 12px rgba(242, 103, 34, 0.15)'
            }}>
              <StatCard>
                <StatIcon sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                  <ManagerIcon fontSize="large" sx={{ color: 'white' }} />
                </StatIcon>
                <StatContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, letterSpacing: '0.5px', fontWeight: 500 }}>Managers</Typography>
                  <StatValue>{userStats.managers}</StatValue>
                </StatContent>
              </StatCard>
            </StyledPaper>
          </Box>
          
          {/* Employees */}
          <Box sx={{ flex: '1 1 calc(50% - 24px)', minWidth: '240px' }}>
            <StyledPaper sx={{ 
              bgcolor: 'white', 
              color: '#333',
              border: `1px solid ${orangeColor}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <StatCard>
                <StatIcon sx={{ bgcolor: lightOrange }}>
                  <EmployeeIcon fontSize="large" sx={{ color: orangeColor }} />
                </StatIcon>
                <StatContent>
                  <Typography variant="body2" sx={{ color: 'text.secondary', letterSpacing: '0.5px', fontWeight: 500 }}>Employees</Typography>
                  <StatValue sx={{ color: '#333' }}>{userStats.employees}</StatValue>
                </StatContent>
              </StatCard>
            </StyledPaper>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <ViewAllButton 
            variant="outlined" 
            sx={{ 
              color: orangeColor,
              borderColor: orangeColor,
              '&:hover': {
                borderColor: orangeColor,
                backgroundColor: 'rgba(242, 103, 34, 0.05)',
              }
            }}
            onClick={() => router.push('/dashboard/users')}
          >
            View All Users
          </ViewAllButton>
        </Box>
      </Box>
    </Box>
  );
} 