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
  StepLabel
} from '@mui/material';
import { 
  HelpOutline,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';

interface TourStep {
  id: string;
  title: string;
  content: string;
  image?: string;
}

const defaultSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Hearing Hope Task Management System',
    content: 'This quick tour will guide you through the main features of our task management system.'
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    content: 'Use the sidebar to navigate between different sections of the application including Dashboard, Tasks, Reports, Calendar, and more.'
  },
  {
    id: 'profile',
    title: 'Your Profile',
    content: 'Click on your avatar in the top-right corner to access your profile settings, update your information, or log out.'
  },
  {
    id: 'dark-mode',
    title: 'Dark Mode',
    content: 'Toggle between light and dark mode using the moon/sun icon in the top toolbar to suit your preference.'
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
            minWidth: '50px', 
            width: '50px', 
            height: '50px', 
            padding: 0,
            boxShadow: 3
          }}
          aria-label="Start guided tour"
        >
          <HelpOutline />
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
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#EE6417', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">{currentStep?.title}</Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          {/* Tour content */}
          <Box sx={{ minHeight: 150, mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>{currentStep?.content}</Typography>
          </Box>
          
          {/* Step indicator */}
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.id}>
                <StepLabel>{''}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleBack}
            disabled={isFirstStep}
            startIcon={<BackIcon />}
            sx={{ color: mode === 'dark' ? '#f5f5f5' : '#333333' }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {isLastStep ? (
            <Button 
              onClick={handleFinish}
              variant="contained"
              color="primary"
              endIcon={<CheckIcon />}
            >
              Finish
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              variant="contained"
              color="primary"
              endIcon={<NextIcon />}
            >
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
} 