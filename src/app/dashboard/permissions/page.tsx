'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import Permission from '@/components/common/Permission';
import { RESOURCES, ACTIONS } from '@/types/permissions';
import UserPermissionsManagement from '@/components/users/UserPermissionsManagement';

export default function PermissionsPage() {
  const { user } = useAuth();
  const { permissions, loading, error, reloadPermissions } = usePermissions();
  const [tabValue, setTabValue] = useState(0);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  
  // Try to bootstrap permissions on page load
  useEffect(() => {
    const bootstrapOnLoad = async () => {
      // Only run if we have a user and permissions are loaded
      if (user && !loading && !bootstrapLoading) {
        try {
          setBootstrapLoading(true);
          // Call the bootstrap API
          const response = await fetch('/api/bootstrap-permissions', {
            method: 'GET',
          });
          
          if (response.ok) {
            // Reload permissions after bootstrapping
            reloadPermissions();
          }
        } catch (error) {
          console.error('Error bootstrapping permissions on load:', error);
          setBootstrapError('Failed to initialize permissions. Try refreshing the page.');
        } finally {
          setBootstrapLoading(false);
        }
      }
    };
    
    bootstrapOnLoad();
  }, [user, loading, reloadPermissions]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading || bootstrapLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || bootstrapError) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error || bootstrapError}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Permissions Management
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Configure and manage granular permissions for users and groups.
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={async () => {
                try {
                  setBootstrapLoading(true);
                  // First try the direct fix API
                  const response = await fetch('/api/system/fix-permissions');
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                      alert(`Permissions fixed for ${data.count} users! The page will reload.`);
                      window.location.reload();
                    } else {
                      throw new Error(data.message || 'Failed to fix permissions');
                    }
                  } else {
                    // Fall back to the bootstrap API
                    const bootstrapResponse = await fetch('/api/bootstrap-permissions', {
                      method: 'GET',
                    });
                    
                    if (bootstrapResponse.ok) {
                      alert('Permissions bootstrapped successfully. The page will reload.');
                      window.location.reload();
                    } else {
                      const data = await bootstrapResponse.json();
                      throw new Error(data.message || 'Failed to bootstrap permissions');
                    }
                  }
                } catch (error: any) {
                  console.error('Error fixing permissions:', error);
                  setBootstrapError(error.message || 'Failed to fix permissions. Please try again.');
                } finally {
                  setBootstrapLoading(false);
                }
              }}
              disabled={bootstrapLoading}
              sx={{ mr: 2 }}
            >
              Fix All Permissions
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={async () => {
                try {
                  setBootstrapLoading(true);
                  const response = await fetch('/api/bootstrap-permissions', {
                    method: 'GET',
                  });
                  
                  if (response.ok) {
                    // Show success message
                    alert('Permissions bootstrapped successfully. The page will reload.');
                    // Reload the page
                    window.location.reload();
                  } else {
                    const data = await response.json();
                    setBootstrapError(data.message || 'Failed to bootstrap permissions');
                  }
                } catch (error) {
                  console.error('Error manually bootstrapping permissions:', error);
                  setBootstrapError('Failed to bootstrap permissions. Please try again.');
                } finally {
                  setBootstrapLoading(false);
                }
              }}
              disabled={bootstrapLoading}
              startIcon={bootstrapLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              Bootstrap My Permissions
            </Button>
          </Box>
        </Box>
        {bootstrapError && <Alert severity="error" sx={{ mb: 2 }}>{bootstrapError}</Alert>}
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Your Permissions" />
          <Tab label="User Permissions" />
          <Tab label="Permission Groups" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && <YourPermissionsTab permissions={permissions} />}
          {tabValue === 1 && (
            <>
              {user && (user.role === 'SUPER_ADMIN' || permissions.includes('users:read')) ? (
                <UserPermissionsTab />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Limited Access
                  </Typography>
                  <Typography variant="body1">
                    You need the 'users:read' permission to manage user permissions.
                    Use the "Bootstrap All Permissions" button at the top of the page to fix this.
                  </Typography>
                </Box>
              )}
            </>
          )}
          {tabValue === 2 && (
            <>
              {user && (user.role === 'SUPER_ADMIN' || permissions.includes('users:create')) ? (
                <PermissionGroupsTab />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Limited Access
                  </Typography>
                  <Typography variant="body1">
                    You need the 'users:create' permission to manage permission groups.
                    Use the "Bootstrap All Permissions" button at the top of the page to fix this.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

// Tab for displaying the current user's permissions
function YourPermissionsTab({ permissions }: { permissions: string[] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Group permissions by resource
  const permissionsByResource: Record<string, string[]> = {};
  
  permissions.forEach(permission => {
    const [resource] = permission.split(':');
    if (!permissionsByResource[resource]) {
      permissionsByResource[resource] = [];
    }
    permissionsByResource[resource].push(permission);
  });

  const handleBootstrapPermissions = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/bootstrap-permissions', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to bootstrap permissions: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('Your permissions have been updated. Please refresh the page to see changes.');
      } else {
        throw new Error(data.message || 'Failed to bootstrap permissions');
      }
    } catch (error: any) {
      console.error('Error bootstrapping permissions:', error);
      setError(error.message || 'An error occurred while bootstrapping permissions');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Permissions
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleBootstrapPermissions}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Bootstrap Permissions
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%"><strong>Resource</strong></TableCell>
              <TableCell><strong>Permissions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(permissionsByResource).map(([resource, perms]) => (
              <TableRow key={resource}>
                <TableCell>
                  <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                    {resource}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {perms.map(perm => {
                      const action = perm.split(':')[1];
                      return (
                        <Chip 
                          key={perm} 
                          label={action} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      );
                    })}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            
            {Object.keys(permissionsByResource).length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No permissions found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// Tab for managing user permissions
function UserPermissionsTab() {
  return <UserPermissionsManagement />;
}

// Tab for managing permission groups
function PermissionGroupsTab() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<any | null>(null);

  // Fetch permission groups and generate all available permissions
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/permissions/groups');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch permission groups: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setGroups(data.groups || []);
        } else {
          throw new Error(data.message || 'Failed to fetch permission groups');
        }
      } catch (error: any) {
        console.error('Error fetching permission groups:', error);
        setError(error.message || 'An error occurred while fetching permission groups');
      } finally {
        setLoading(false);
      }
    };

    // Generate all available permissions
    const permissions: string[] = [];
    Object.values(RESOURCES).forEach(resource => {
      Object.values(ACTIONS).forEach(action => {
        permissions.push(`${resource}:${action}`);
      });
    });
    setAvailablePermissions(permissions);
    
    fetchGroups();
  }, []);

  const handleOpenDialog = (group: any = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
        permissions: group.permissions || []
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setEditingGroup(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => {
      if (prev.permissions.includes(permission)) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => p !== permission)
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permission]
        };
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const url = editingGroup 
        ? `/api/permissions/groups/${editingGroup._id}`
        : '/api/permissions/groups';
        
      const method = editingGroup ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${editingGroup ? 'update' : 'create'} permission group: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Permission group ${editingGroup ? 'updated' : 'created'} successfully`);
        
        // Refresh the groups list
        const refreshResponse = await fetch('/api/permissions/groups');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success) {
            setGroups(refreshData.groups || []);
          }
        }
        
        handleCloseDialog();
      } else {
        throw new Error(data.message || `Failed to ${editingGroup ? 'update' : 'create'} permission group`);
      }
    } catch (error: any) {
      console.error(`Error ${editingGroup ? 'updating' : 'creating'} permission group:`, error);
      setError(error.message || `An error occurred while ${editingGroup ? 'updating' : 'creating'} the permission group`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (group: any) => {
    setGroupToDelete(group);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/permissions/groups/${groupToDelete._id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete permission group: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Permission group deleted successfully');
        setGroups(groups.filter(g => g._id !== groupToDelete._id));
        setDeleteConfirmOpen(false);
        setGroupToDelete(null);
      } else {
        throw new Error(data.message || 'Failed to delete permission group');
      }
    } catch (error: any) {
      console.error('Error deleting permission group:', error);
      setError(error.message || 'An error occurred while deleting the permission group');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setGroupToDelete(null);
  };

  // Group available permissions by resource
  const groupedPermissions: Record<string, string[]> = {};
  availablePermissions.forEach(permission => {
    const [resource] = permission.split(':');
    if (!groupedPermissions[resource]) {
      groupedPermissions[resource] = [];
    }
    groupedPermissions[resource].push(permission);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Permission Groups Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Create New Group
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {loading && !isDialogOpen ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Permissions</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No permission groups found. Create a new group to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                groups.map(group => (
                  <TableRow key={group._id}>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.description || 'No description'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {group.permissions && group.permissions.length > 0 ? (
                          group.permissions.slice(0, 5).map((permission: string) => (
                            <Chip 
                              key={permission} 
                              label={permission} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No permissions
                          </Typography>
                        )}
                        {group.permissions && group.permissions.length > 5 && (
                          <Chip 
                            label={`+${group.permissions.length - 5} more`} 
                            size="small" 
                            color="default" 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleOpenDialog(group)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(group)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Create/Edit Group Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Permission Group' : 'Create New Permission Group'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Group Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Select Permissions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ maxHeight: '400px', overflow: 'auto', p: 1 }}>
            {Object.entries(groupedPermissions).map(([resource, permissions]) => (
              <Box key={resource} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1 }}>
                  {resource}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {permissions.map(permission => {
                    const action = permission.split(':')[1];
                    const isSelected = formData.permissions.includes(permission);
                    
                    return (
                      <Chip 
                        key={permission} 
                        label={action}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                        onClick={() => handlePermissionToggle(permission)}
                      />
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading || !formData.name.trim() || formData.permissions.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : editingGroup ? 'Update Group' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the permission group "{groupToDelete?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Component to display when user doesn't have permission
function NotAuthorized() {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h6" color="error" gutterBottom>
        Access Denied
      </Typography>
      <Typography variant="body1">
        You don't have permission to access this feature.
      </Typography>
    </Box>
  );
} 