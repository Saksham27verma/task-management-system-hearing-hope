'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';
import { useRouter } from 'next/navigation';

// Types for User Management
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  phone: string;
  position: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  phone: string;
  position: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuUser, setActionMenuUser] = useState<User | null>(null);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Form data for adding/editing users
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE',
    phone: '',
    position: ''
  });

  // Form validation
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    position: ''
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'An error occurred while fetching users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search query and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && user.isActive) || 
      (statusFilter === 'inactive' && !user.isActive);
      
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle pagination change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for the field being edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Validate form data
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...formErrors };
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Password validation (only for new users or password change)
    if (!selectedUser) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
        isValid = false;
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        isValid = false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }
    
    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    }
    
    // Position validation
    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
      isValid = false;
    }
    
    setFormErrors(newErrors);
    return isValid;
  };

  // Handle add user dialog open
  const handleAddDialogOpen = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'EMPLOYEE',
      phone: '',
      position: ''
    });
    setFormErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      position: ''
    });
    setOpenAddDialog(true);
  };

  // Handle edit user dialog open
  const handleEditDialogOpen = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      phone: user.phone,
      position: user.position
    });
    setFormErrors({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      position: ''
    });
    setOpenAddDialog(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenAddDialog(false);
    setOpenDeleteDialog(false);
  };

  // Handle delete dialog open
  const handleDeleteDialogOpen = (user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };
  
  // Handle delete user (permanent deletion)
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success'
        });
        handleDialogClose();
        fetchUsers();
      } else {
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred while deleting the user',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle save user (add or edit)
  const handleSaveUser = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const payload = {
        ...formData
      };
      
      // Remove confirmPassword from payload
      delete payload.confirmPassword;
      
      // If editing and password is empty, remove password from payload
      if (selectedUser && !formData.password) {
        delete payload.password;
      }
      
      const url = selectedUser 
        ? `/api/users/${selectedUser._id}` 
        : '/api/users';
      
      const method = selectedUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbar({
          open: true,
          message: selectedUser 
            ? 'User updated successfully' 
            : 'User created successfully',
          severity: 'success'
        });
        handleDialogClose();
        fetchUsers();
      } else {
        throw new Error(data.message || 'Failed to save user');
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred while saving the user',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle user deactivation/activation (separate from permanent deletion)
  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !selectedUser.isActive
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbar({
          open: true,
          message: selectedUser.isActive 
            ? 'User deactivated successfully' 
            : 'User activated successfully',
          severity: 'success'
        });
        handleDialogClose();
        fetchUsers();
      } else {
        throw new Error(data.message || 'Failed to update user status');
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred while updating user status',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get role display name
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

  // Add a function to handle permissions navigation
  const handleManagePermissions = (userId: string) => {
    router.push(`/dashboard/permissions?userId=${userId}`);
  };

  // Action menu handlers
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuUser(user);
  };
  
  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionMenuUser(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all users and their roles in the system
        </Typography>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        {/* Filters and search */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            label="Search Users"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
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
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
              <MenuItem value="EMPLOYEE">Employee</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchUsers}
            size="small"
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleAddDialogOpen}
            disabled={!currentUser || currentUser.role !== 'SUPER_ADMIN'}
          >
            Add User
          </Button>
        </Box>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Users table */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getRoleDisplay(user.role)} 
                          color={getRoleColor(user.role) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.position}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Inactive'} 
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <IconButton 
                            size="small" 
                            aria-label="actions"
                            aria-controls="user-actions-menu"
                            aria-haspopup="true"
                            onClick={(event) => handleActionMenuOpen(event, user)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              padding: '4px'
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Actions Menu */}
        <Menu
          id="user-actions-menu"
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              mt: 1.5,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem
            onClick={() => {
              if (actionMenuUser) handleEditDialogOpen(actionMenuUser);
              handleActionMenuClose();
            }}
            disabled={!currentUser || currentUser.role !== 'SUPER_ADMIN'}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>Edit User</ListItemText>
          </MenuItem>
          
          <MenuItem
            onClick={() => {
              if (actionMenuUser) handleManagePermissions(actionMenuUser._id);
              handleActionMenuClose();
            }}
            disabled={true}
          >
            <ListItemIcon>
              <LockIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText>Manage Permissions</ListItemText>
          </MenuItem>
          
          <MenuItem
            onClick={() => {
              if (actionMenuUser) handleDeleteDialogOpen(actionMenuUser);
              handleActionMenuClose();
            }}
            disabled={
              !actionMenuUser ||
              !currentUser || 
              currentUser.role !== 'SUPER_ADMIN' || 
              (actionMenuUser && actionMenuUser._id === currentUser.id) || 
              (actionMenuUser && actionMenuUser.role === 'SUPER_ADMIN')
            }
            sx={{
              color: 'error.main',
              '&.Mui-disabled': {
                color: 'error.light',
                opacity: 0.7
              }
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete User</ListItemText>
          </MenuItem>
        </Menu>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={openAddDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            
            <TextField
              margin="normal"
              required={!selectedUser}
              fullWidth
              name="password"
              label={selectedUser ? "New Password (leave blank to keep current)" : "Password"}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
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
            
            <TextField
              margin="normal"
              required={!selectedUser}
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
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
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleSelectChange}
              >
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="EMPLOYEE">Employee</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="position"
              label="Job Position"
              id="position"
              value={formData.position}
              onChange={handleInputChange}
              error={!!formErrors.position}
              helperText={formErrors.position}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="phone"
              label="Phone Number"
              id="phone"
              value={formData.phone}
              onChange={handleInputChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained" 
            color="primary" 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          User Actions
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {selectedUser?.name && (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  What would you like to do with {selectedUser.name}?
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Deactivate:</strong> User will be marked as inactive but all data will be preserved. They will not be able to log in.
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Delete:</strong> User will be permanently removed from the system. This action cannot be undone.
                </Typography>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={handleDialogClose} disabled={isLoading}>
            Cancel
          </Button>
          <Box>
            {selectedUser?.isActive && (
              <Button 
                onClick={handleToggleUserStatus} 
                color="warning"
                variant="outlined"
                disabled={isLoading}
                sx={{ mr: 1 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Deactivate'}
              </Button>
            )}
            <Button 
              onClick={handleDeleteUser} 
              color="error" 
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Delete Permanently'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 