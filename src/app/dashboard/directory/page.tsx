'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Chip,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  PersonOutline as PersonIcon,
  Work as WorkIcon,
  ContactPhone as ContactPhoneIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Call as CallIcon,
  Mail as MailIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';

// Define User type for directory
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  isActive: boolean;
}

export default function DirectoryPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentTab, setCurrentTab] = useState(0);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching users from API...');
      const response = await fetch('/api/users?isActive=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error details:', errorData);
        throw new Error(errorData.message || `Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Users data received:', data.success, 'Count:', data.users?.length || 0);
      
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        throw new Error(data.message || 'Failed to fetch users - invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'An error occurred while fetching users');
      // Initialize with empty array instead of mock data
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role filter change
  const handleRoleFilterChange = (event: SelectChangeEvent<string>) => {
    setRoleFilter(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Handle copy to clipboard
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyMessage(`${type} copied to clipboard`);
        setTimeout(() => setCopyMessage(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(user => {
      // Filter by search query
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery);
      
      // Filter by role
      const matchesRole = roleFilter === '' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

  // Group users by first letter of name
  const groupedUsers: { [key: string]: User[] } = {};
  
  filteredAndSortedUsers.forEach(user => {
    const firstLetter = user.name.charAt(0).toUpperCase();
    if (!groupedUsers[firstLetter]) {
      groupedUsers[firstLetter] = [];
    }
    groupedUsers[firstLetter].push(user);
  });

  // Sort letters
  const sortedLetters = Object.keys(groupedUsers).sort();

  // Get role display text
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'MANAGER':
        return 'Manager';
      case 'EMPLOYEE':
        return 'Employee';
      default:
        return role;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      case 'MANAGER':
        return 'primary';
      case 'EMPLOYEE':
        return 'info';
      default:
        return 'default';
    }
  };

  // Create avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    
    // Simple hash function to get consistent color for a name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Format phone number for tel: links
  const formatPhoneForLink = (phone: string) => {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  };

  // Render list view
  const renderListView = () => {
    return (
      <List>
        {sortedLetters.map(letter => (
          <React.Fragment key={letter}>
            <Box sx={{ 
              bgcolor: 'grey.100', 
              px: 2, 
              py: 0.5, 
              position: 'sticky', 
              top: 0, 
              zIndex: 1 
            }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {letter}
              </Typography>
            </Box>
            
            {groupedUsers[letter].map(user => (
              <React.Fragment key={user._id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getAvatarColor(user.name) }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight="medium">
                          {user.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={getRoleDisplay(user.role)}
                          color={getRoleColor(user.role) as any}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <WorkIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" component="span">
                            {user.position}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <EmailIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography 
                            variant="body2" 
                            component="a" 
                            href={`mailto:${user.email}`}
                            sx={{ 
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline',
                                fontWeight: 'medium'
                              }
                            }}
                          >
                            {user.email}
                          </Typography>
                          <IconButton 
                            size="small" 
                            color="primary"
                            sx={{ ml: 0.5 }} 
                            href={`mailto:${user.email}`}
                            aria-label="Send email"
                            title="Send email"
                          >
                            <MailIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ ml: 0.5 }} 
                            onClick={() => handleCopy(user.email, 'Email')}
                            title="Copy email"
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography 
                            variant="body2" 
                            component="a" 
                            href={`tel:${formatPhoneForLink(user.phone)}`}
                            sx={{ 
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline',
                                fontWeight: 'medium'
                              }
                            }}
                          >
                            {user.phone}
                          </Typography>
                          <IconButton 
                            size="small" 
                            color="primary"
                            sx={{ ml: 0.5 }} 
                            href={`tel:${formatPhoneForLink(user.phone)}`}
                            aria-label="Call phone number"
                            title="Call phone number"
                          >
                            <CallIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ ml: 0.5 }} 
                            onClick={() => handleCopy(user.phone, 'Phone')}
                            title="Copy phone number"
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </List>
    );
  };

  // Render grid view (card layout)
  const renderGridView = () => {
    return (
      <Grid container spacing={2}>
        {filteredAndSortedUsers.map(user => (
          <Grid item xs={12} sm={6} md={4} key={user._id}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 3
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    bgcolor: getAvatarColor(user.name),
                    mr: 2
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {user.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WorkIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {user.position}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Chip 
                label={getRoleDisplay(user.role)}
                color={getRoleColor(user.role) as any}
                size="small"
                sx={{ alignSelf: 'flex-start', mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 0.5 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography 
                  variant="body2" 
                  component="a" 
                  href={`mailto:${user.email}`}
                  sx={{ 
                    color: 'primary.main',
                    flexGrow: 1,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                      fontWeight: 'medium'
                    }
                  }}
                >
                  {user.email}
                </Typography>
                <IconButton 
                  size="small" 
                  color="primary"
                  href={`mailto:${user.email}`}
                  aria-label="Send email"
                  title="Send email"
                >
                  <MailIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleCopy(user.email, 'Email')}
                  title="Copy email"
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography 
                  variant="body2" 
                  component="a" 
                  href={`tel:${formatPhoneForLink(user.phone)}`}
                  sx={{ 
                    color: 'primary.main',
                    flexGrow: 1,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                      fontWeight: 'medium'
                    }
                  }}
                >
                  {user.phone}
                </Typography>
                <IconButton 
                  size="small" 
                  color="primary"
                  href={`tel:${formatPhoneForLink(user.phone)}`}
                  aria-label="Call phone number"
                  title="Call phone number"
                >
                  <CallIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleCopy(user.phone, 'Phone')}
                  title="Copy phone number"
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Phone Directory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and search contact information for all staff members
        </Typography>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        {/* Search and filter bar */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          gap: 2, 
          mb: 3 
        }}>
          <TextField
            placeholder="Search by name, position, email, or phone"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: { sm: '400px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={roleFilter}
              label="Filter by Role"
              onChange={handleRoleFilterChange}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
              <MenuItem value="EMPLOYEE">Employee</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton 
            color="primary" 
            onClick={fetchUsers}
            title="Refresh"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
        
        {/* Copy notification */}
        {copyMessage && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="success" onClose={() => setCopyMessage(null)}>
              {copyMessage}
            </Alert>
          </Box>
        )}
        
        {/* Error message */}
        {error && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}
        
        {/* View tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab 
              label="List View" 
              icon={<PersonIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Grid View" 
              icon={<ContactPhoneIcon />} 
              iconPosition="start" 
            />
          </Tabs>
        </Box>
        
        {/* Loading indicator */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredAndSortedUsers.length === 0 ? (
          <Alert severity="info">
            No users found matching your search criteria
          </Alert>
        ) : (
          <Box>
            {currentTab === 0 ? renderListView() : renderGridView()}
          </Box>
        )}
      </Paper>
    </Container>
  );
} 