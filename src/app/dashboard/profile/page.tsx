'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Avatar,
  TextField,
  Button,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockReset as LockResetIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error';
    open: boolean;
  }>({ message: '', severity: 'success', open: false });
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    position: user?.position || '',
    phone: ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Form errors
  const [profileErrors, setProfileErrors] = useState({
    name: '',
    email: '',
    position: '',
    phone: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        position: user.position || '',
        phone: ''
      });
    }
  }, [user]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle input change for profile form
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (profileErrors[name as keyof typeof profileErrors]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle input change for password form
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (passwordErrors[name as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate profile form
  const validateProfileForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...profileErrors };
    
    // Name validation
    if (!profileForm.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(profileForm.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Position validation
    if (!profileForm.position.trim()) {
      newErrors.position = 'Position is required';
      isValid = false;
    }
    
    setProfileErrors(newErrors);
    return isValid;
  };
  
  // Validate password form
  const validatePasswordForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...passwordErrors };
    
    // Current password validation
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      isValid = false;
    }
    
    // New password validation
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
      isValid = false;
    }
    
    // Confirm password validation
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setPasswordErrors(newErrors);
    return isValid;
  };
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!validateProfileForm() || !user) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          position: profileForm.position,
          phone: profileForm.phone,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setNotification({
          message: 'Profile updated successfully',
          severity: 'success',
          open: true,
        });
        
        // Refresh user data to see the changes
        await refreshUser();
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : 'An error occurred while updating profile',
        severity: 'error',
        open: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async () => {
    if (!validatePasswordForm() || !user) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          password: passwordForm.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setNotification({
          message: 'Password changed successfully',
          severity: 'success',
          open: true,
        });
        
        // Reset the password form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : 'An error occurred while changing password',
        severity: 'error',
        open: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ p: 4, mt: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1">
            User Profile
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'secondary.main',
              fontSize: '2.5rem',
              mr: 3
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          
          <Box>
            <Typography variant="h5">{user?.name || 'User'}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
              {user?.position || 'Position not available'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'Email not available'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Role: {user?.role || 'Unknown'}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="profile tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<AccountCircleIcon />} 
            label="Personal Information" 
            iconPosition="start"
            id="profile-tab-0"
          />
          <Tab 
            icon={<LockResetIcon />} 
            label="Change Password" 
            iconPosition="start"
            id="profile-tab-1"
          />
        </Tabs>
        
        {/* Personal Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3
          }}>
            <TextField
              label="Name"
              name="name"
              fullWidth
              variant="outlined"
              value={profileForm.name}
              onChange={handleProfileInputChange}
              error={!!profileErrors.name}
              helperText={profileErrors.name}
              margin="normal"
            />
            
            <TextField
              label="Email"
              name="email"
              fullWidth
              variant="outlined"
              value={profileForm.email}
              onChange={handleProfileInputChange}
              error={!!profileErrors.email}
              helperText={profileErrors.email}
              margin="normal"
            />
            
            <TextField
              label="Position"
              name="position"
              fullWidth
              variant="outlined"
              value={profileForm.position}
              onChange={handleProfileInputChange}
              error={!!profileErrors.position}
              helperText={profileErrors.position}
              margin="normal"
            />
            
            <TextField
              label="Phone"
              name="phone"
              fullWidth
              variant="outlined"
              value={profileForm.phone}
              onChange={handleProfileInputChange}
              error={!!profileErrors.phone}
              helperText={profileErrors.phone}
              margin="normal"
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              onClick={handleProfileUpdate}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </TabPanel>
        
        {/* Change Password Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3
          }}>
            <Box sx={{ gridColumn: { xs: '1', md: '1 / 2' } }}>
              <TextField
                label="Current Password"
                name="currentPassword"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                variant="outlined"
                value={passwordForm.currentPassword}
                onChange={handlePasswordInputChange}
                error={!!passwordErrors.currentPassword}
                helperText={passwordErrors.currentPassword}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Box sx={{ gridColumn: { xs: '1', md: '2 / 3' } }}>
              {/* Empty for layout */}
            </Box>
            
            <Box sx={{ gridColumn: { xs: '1', md: '1 / 2' } }}>
              <TextField
                label="New Password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                variant="outlined"
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
                error={!!passwordErrors.newPassword}
                helperText={passwordErrors.newPassword}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Box sx={{ gridColumn: { xs: '1', md: '2 / 3' } }}>
              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                variant="outlined"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInputChange}
                error={!!passwordErrors.confirmPassword}
                helperText={passwordErrors.confirmPassword}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
            Your password should be at least 6 characters long. For best security, use a combination of letters, numbers, and special characters.
          </Alert>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <LockResetIcon />}
              onClick={handlePasswordChange}
              disabled={isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 