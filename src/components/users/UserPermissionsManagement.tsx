'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Checkbox,
  FormControlLabel,
  Divider,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Search as SearchIcon, Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { RESOURCES, ACTIONS } from '@/types/permissions';
import { useSearchParams } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

// Client component that uses useSearchParams
function UserPermissionsContent() {
  const searchParams = useSearchParams();
  const urlUserId = searchParams.get('userId');
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(urlUserId || '');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // When a user is selected, fetch their permissions
  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
    } else {
      setUserPermissions([]);
    }
  }, [selectedUserId]);

  // Generate all available permissions when component mounts
  useEffect(() => {
    const permissions: string[] = [];
    
    // Generate all possible permissions based on resources and actions
    Object.values(RESOURCES).forEach(resource => {
      Object.values(ACTIONS).forEach(action => {
        permissions.push(`${resource}:${action}`);
      });
    });
    
    setAvailablePermissions(permissions);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user permissions: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched permissions:', data.permissions);
        setUserPermissions(data.permissions || []);
      } else {
        throw new Error(data.message || 'Failed to fetch user permissions');
      }
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
      setError(error.message || 'An error occurred while fetching user permissions');
      // Set empty array in case of error
      setUserPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (event: SelectChangeEvent<string>) => {
    setSelectedUserId(event.target.value);
  };

  const handlePermissionToggle = (permission: string) => {
    if (userPermissions.includes(permission)) {
      setUserPermissions(userPermissions.filter(p => p !== permission));
    } else {
      setUserPermissions([...userPermissions, permission]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Saving permissions:', userPermissions);
      const response = await fetch(`/api/users/${selectedUserId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customPermissions: userPermissions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update user permissions: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('User permissions updated successfully');
        // Refresh the permissions to confirm changes
        fetchUserPermissions(selectedUserId);
      } else {
        throw new Error(data.message || 'Failed to update user permissions');
      }
    } catch (error: any) {
      console.error('Error updating user permissions:', error);
      setError(error.message || 'An error occurred while updating user permissions');
    } finally {
      setLoading(false);
    }
  };

  // Filter permissions by search query
  const filteredPermissions = availablePermissions.filter(permission => {
    if (!searchQuery) return true;
    return permission.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group permissions by resource
  const groupedPermissions: Record<string, string[]> = {};
  
  filteredPermissions.forEach(permission => {
    const [resource] = permission.split(':');
    
    if (!groupedPermissions[resource]) {
      groupedPermissions[resource] = [];
    }
    
    groupedPermissions[resource].push(permission);
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Permissions Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="user-select-label">Select User</InputLabel>
          <Select
            labelId="user-select-label"
            id="user-select"
            value={selectedUserId}
            label="Select User"
            onChange={handleUserChange}
            disabled={loading}
          >
            <MenuItem value="">
              <em>Select a user</em>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.name} ({user.email}) - {user.role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      
      {selectedUserId && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">User Permissions</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={() => fetchUserPermissions(selectedUserId)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />} 
                onClick={handleSavePermissions}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
          
          <TextField
            fullWidth
            label="Search Permissions"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Resource</TableCell>
                    <TableCell>Permissions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                    <TableRow key={resource}>
                      <TableCell>
                        <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                          {resource}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {permissions.map((permission) => {
                            const isSelected = userPermissions.includes(permission);
                            const [, action] = permission.split(':');
                            
                            return (
                              <Chip 
                                key={permission}
                                label={action}
                                onClick={() => handlePermissionToggle(permission)}
                                color={isSelected ? "primary" : "default"}
                                sx={{ 
                                  textTransform: 'capitalize',
                                  cursor: 'pointer',
                                  opacity: isSelected ? 1 : 0.7,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    opacity: 1,
                                  }
                                }}
                              />
                            );
                          })}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {Object.keys(groupedPermissions).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography align="center" sx={{ py: 2 }}>
                          {searchQuery ? 'No permissions match your search' : 'No permissions available'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
}

// Wrapper component with Suspense
export default function UserPermissionsManagement() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
      <UserPermissionsContent />
    </Suspense>
  );
}