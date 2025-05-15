'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper,
  alpha
} from '@mui/material';
import { 
  HelpOutline,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Check as CheckIcon,
  Dashboard as DashboardIcon,
  AssignmentOutlined as TaskIcon, 
  CalendarMonth as CalendarIcon,
  NotificationsOutlined as NoticeIcon,
  EmailOutlined as MessageIcon,
  Videocam as MeetingIcon,
  ContactPhone as DirectoryIcon,
  Business as CompanyIcon,
  Person as ProfileIcon,
  Menu as NavigationIcon,
  Brightness4 as DarkModeIcon,
  LiveHelp as HelpIcon
} from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';

interface TourStep {
  id: string;
  title: string;
  content: string;
  icon?: React.ReactNode;
  image?: string;
}

const defaultSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Hearing Hope Task Management System',
    content: 'This guided tour will help you discover all the powerful features designed to streamline your workflow and enhance productivity. Let\'s explore what this system has to offer!',
    icon: <HelpOutline />
  },
  {
    id: 'dashboard',
    title: 'Your Personalized Dashboard',
    content: 'Your dashboard provides a complete overview of your tasks, upcoming deadlines, and key performance metrics. Track your progress, identify priorities, and get a snapshot of your workload at a glance.',
    icon: <DashboardIcon />
  },
  {
    id: 'tasks',
    title: 'Task Management',
    content: 'The Tasks section allows you to view, create, and manage all your assignments. Sort tasks by priority, due date, or status. Add detailed descriptions, attach files, set reminders, and track progress—everything you need to stay organized.',
    icon: <TaskIcon />
  },
  {
    id: 'calendar',
    title: 'Interactive Calendar',
    content: 'The Calendar provides a visual timeline of all your tasks, meetings, and deadlines. Toggle between daily, weekly, or monthly views, create events directly from the calendar, and sync with your Google Calendar for seamless scheduling.',
    icon: <CalendarIcon />
  },
  {
    id: 'notices',
    title: 'Notice Board',
    content: 'Stay informed with the latest announcements and important updates from your organization. The Notice Board highlights critical information, policy changes, and company-wide communications in one centralized location.',
    icon: <NoticeIcon />
  },
  {
    id: 'messages',
    title: 'Messaging System',
    content: 'Communicate directly with team members through our secure messaging platform. Send private or group messages, share files, and keep all your work-related communications organized in conversation threads.',
    icon: <MessageIcon />
  },
  {
    id: 'meetings',
    title: 'Meeting Management',
    content: 'Schedule, join, and manage virtual meetings directly through the platform. Send invitations, set agendas, record minutes, and even conduct video conferences—all integrated within your workspace.',
    icon: <MeetingIcon />
  },
  {
    id: 'directory',
    title: 'Phone Directory',
    content: 'Quickly find contact information for anyone in your organization. The Phone Directory provides searchable access to employee phone numbers, email addresses, departments, and job titles.',
    icon: <DirectoryIcon />
  },
  {
    id: 'company',
    title: 'Company Information',
    content: 'Access important details about your organization including policies, procedures, organizational charts, and company resources. Stay connected with your company\'s mission, values, and structure.',
    icon: <CompanyIcon />
  },
  {
    id: 'profile',
    title: 'Your Profile',
    content: 'Manage your personal information, update your contact details, set notification preferences, and customize your account settings through your profile page.',
    icon: <ProfileIcon />
  },
  {
    id: 'navigation',
    title: 'Navigation Tips',
    content: 'Use the sidebar to navigate between different sections. The top bar provides quick access to your profile, notifications, and theme preferences. On mobile, tap the menu icon to access the navigation drawer.',
    icon: <NavigationIcon />
  },
  {
    id: 'dark-mode',
    title: 'Accessibility Features',
    content: 'Toggle between light and dark mode using the moon/sun icon in the top toolbar. This feature reduces eye strain and provides comfortable viewing options for different lighting conditions and preferences.',
    icon: <DarkModeIcon />
  },
  {
    id: 'help',
    title: 'Need Help?',
    content: 'You can restart this tour anytime by clicking the help button in the bottom-right corner. If you need additional assistance, please contact your manager or the system administrator.',
    icon: <HelpIcon />
  }
];

interface WalkthroughTourProps {
  steps?: TourStep[];
  isFirstVisit?: boolean;
}

export default function WalkthroughTour({
  steps = defaultSteps,
  isFirstVisit = false,
}: WalkthroughTourProps) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hasShownTour, setHasShownTour] = useState(false);
  const { mode } = useThemeMode();
  
  // Check if this is the first visit based on localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenTour = localStorage.getItem('hasSeenTour') === 'true';
      if (!hasSeenTour && !hasShownTour) {
        // Set a small delay to allow the page to fully render
        const timer = setTimeout(() => {
          setOpen(true);
          setHasShownTour(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [hasShownTour]);
  
  const handleStartTour = () => {
    setActiveStep(0);
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('hasSeenTour', 'true');
  };
  
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleFinish = () => {
    setOpen(false);
    localStorage.setItem('hasSeenTour', 'true');
  };
  
  const currentStep = steps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;
  
  return (
    <>
      {/* Help button */}
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          zIndex: 1000 
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleStartTour}
          sx={{ 
            borderRadius: '50%', 
            minWidth: '56px', 
            width: '56px', 
            height: '56px', 
            padding: 0,
            boxShadow: 4,
            bgcolor: '#EE6417',
            color: 'white',
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: '#F26722',
              transform: 'scale(1.1)',
              boxShadow: 6,
            },
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(238, 100, 23, 0.7)'
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(238, 100, 23, 0)'
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(238, 100, 23, 0)'
              }
            }
          }}
          aria-label="Start guided tour"
        >
          <HelpOutline fontSize="medium" />
        </Button>
      </Box>
      
      {/* Tour dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: mode === 'dark' ? '#2a2a2a' : '#ffffff',
            color: mode === 'dark' ? '#f5f5f5' : '#333333',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#EE6417', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {currentStep?.icon && (
              <Box sx={{ 
                display: 'flex', 
                p: 0.5, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255, 255, 255, 0.2)'
              }}>
                {currentStep.icon}
              </Box>
            )}
            <Typography variant="h6" fontWeight="600">{currentStep?.title}</Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            sx={{ 
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.15)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3, px: 3 }}>
          {/* Tour content */}
          <Box sx={{ 
            minHeight: 150, 
            mb: 3,
            py: 1,
            px: 2,
            borderLeft: '4px solid #EE6417',
            backgroundColor: mode === 'dark' ? alpha('#EE6417', 0.1) : alpha('#EE6417', 0.05),
            borderRadius: '0 4px 4px 0'
          }}>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 2, 
                lineHeight: 1.6,
                fontSize: '1rem'
              }}
            >
              {currentStep?.content}
            </Typography>
          </Box>
          
          {/* Step indicator */}
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel
          >
            {steps.map((step, index) => (
              <Step key={step.id}>
                <StepLabel StepIconProps={{
                  sx: {
                    color: activeStep === index ? '#EE6417' : undefined,
                  }
                }}>
                  <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {step.title.length > 20 ? `${step.title.substring(0, 20)}...` : step.title}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3, 
          pb: 2,
          pt: 1,
          borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }}>
          <Button 
            onClick={handleBack}
            disabled={isFirstStep}
            startIcon={<BackIcon />}
            sx={{ 
              color: mode === 'dark' ? '#f5f5f5' : '#333333',
              '&:hover': {
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Typography variant="body2" color="text.secondary">
            {activeStep + 1} of {steps.length}
          </Typography>
          <Box sx={{ width: 16 }} />
          {isLastStep ? (
            <Button 
              onClick={handleFinish}
              variant="contained"
              color="primary"
              endIcon={<CheckIcon />}
              sx={{
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 3,
                }
              }}
            >
              Finish
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              variant="contained"
              color="primary"
              endIcon={<NextIcon />}
              sx={{
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 3,
                }
              }}
            >
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
} 