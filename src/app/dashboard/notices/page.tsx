'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import {
  NotificationsOutlined as NotificationsOutlinedIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarToday as CalendarTodayIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateHuman } from '@/utils/dates';

// Notice interface
interface Notice {
  _id: string;
  title: string;
  content: string;
  postedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  isImportant: boolean;
  expiryDate?: string;
}

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isImportant: false,
    expiryDate: null as Date | null,
    sendNotification: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const canCreateNotices = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  // Fetch notices on component mount
  useEffect(() => {
    fetchNotices();
  }, []);

  // Fetch notices from API
  const fetchNotices = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/notices');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notices: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Validate notices before setting state
        const validNotices = Array.isArray(data.notices) 
          ? data.notices.filter(notice => notice && typeof notice === 'object')
          : [];
          
        if (validNotices.length === 0 && data.notices && data.notices.length > 0) {
          console.warn('Received notices but they were filtered out during validation');
        }
        
        setNotices(validNotices);
      } else {
        throw new Error(data.message || 'Failed to fetch notices: Unknown error');
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching notices');
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for form fields
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, checked } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: name === 'isImportant' || name === 'sendNotification' ? checked : value
    });
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      expiryDate: date
    });
  };

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Open create notice dialog
  const handleCreateDialogOpen = () => {
    setFormData({
      title: '',
      content: '',
      isImportant: false,
      expiryDate: null,
      sendNotification: true
    });
    setCreateDialogOpen(true);
  };

  // Open edit notice dialog
  const handleEditDialogOpen = (notice: Notice) => {
    setSelectedNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      isImportant: notice.isImportant,
      expiryDate: notice.expiryDate ? new Date(notice.expiryDate) : null,
      sendNotification: true // Default to true for editing
    });
    setEditDialogOpen(true);
  };

  // Open delete notice dialog
  const handleDeleteDialogOpen = (notice: Notice) => {
    setSelectedNotice(notice);
    setDeleteDialogOpen(true);
  };

  // Close all dialogs
  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
  };

  // Create new notice
  const handleCreateNotice = async () => {
    if (!formData.title || !formData.content) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          isImportant: formData.isImportant,
          expiryDate: formData.expiryDate,
          sendNotification: formData.sendNotification
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSnackbar({
          open: true,
          message: 'Notice created successfully',
          severity: 'success'
        });
        handleDialogClose();
        await fetchNotices();
      } else {
        throw new Error(data.message || 'Failed to create notice');
      }
    } catch (err: any) {
      console.error('Error creating notice:', err);
      setSnackbar({
        open: true,
        message: err.message || 'An error occurred while creating the notice',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update existing notice
  const handleUpdateNotice = async () => {
    if (!selectedNotice || !formData.title || !formData.content) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/notices/${selectedNotice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          isImportant: formData.isImportant,
          expiryDate: formData.expiryDate
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSnackbar({
          open: true,
          message: 'Notice updated successfully',
          severity: 'success'
        });
        handleDialogClose();
        await fetchNotices();
      } else {
        throw new Error(data.message || 'Failed to update notice');
      }
    } catch (err: any) {
      console.error('Error updating notice:', err);
      setSnackbar({
        open: true,
        message: err.message || 'An error occurred while updating the notice',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete notice
  const handleDeleteNotice = async () => {
    if (!selectedNotice) return;

    setLoading(true);
    
    try {
      const response = await fetch(`/api/notices/${selectedNotice._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSnackbar({
          open: true,
          message: 'Notice deleted successfully',
          severity: 'success'
        });
        handleDialogClose();
        await fetchNotices();
      } else {
        throw new Error(data.message || 'Failed to delete notice');
      }
    } catch (err: any) {
      console.error('Error deleting notice:', err);
      setSnackbar({
        open: true,
        message: err.message || 'An error occurred while deleting the notice',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Filter notices based on search query
  const filteredNotices = notices.filter(notice => {
    if (!notice) return false;
    return (
      notice.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Sort notices by importance and date
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (!a || !b) return 0;
    
    // Sort by importance first
    if (a.isImportant && !b.isImportant) return -1;
    if (!a.isImportant && b.isImportant) return 1;
    
    // Then sort by creation date (newest first)
    return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime();
  });

  // Check if a notice is expired
  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, mt: 2, borderRadius: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" component="h1">
              Notice Board
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchNotices}
              disabled={loading}
            >
              Refresh
            </Button>
            
            {canCreateNotices && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateDialogOpen}
                disabled={loading}
              >
                New Notice
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Search bar */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel htmlFor="search-notices">Search Notices</InputLabel>
            <OutlinedInput
              id="search-notices"
              value={searchQuery}
              onChange={handleSearchChange}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              }
              endAdornment={
                searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }
              label="Search Notices"
            />
          </FormControl>
        </Box>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* No notices message */}
        {!loading && sortedNotices.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No notices found
            </Typography>
            {searchQuery && (
              <Typography variant="body2" color="text.secondary">
                Try using different search terms or clear your search
              </Typography>
            )}
          </Box>
        )}
        
        {/* Notices list */}
        {!loading && sortedNotices.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sortedNotices.filter(notice => notice && notice._id).map(notice => (
              <Card 
                key={notice._id}
                variant="outlined" 
                sx={{ 
                  borderLeft: notice.isImportant ? 4 : 1, 
                  borderLeftColor: notice.isImportant ? 'error.main' : 'divider',
                  opacity: isExpired(notice.expiryDate) ? 0.7 : 1
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" component="h2">
                        {notice.title}
                      </Typography>
                      {notice.isImportant && (
                        <Chip 
                          icon={<PriorityHighIcon />} 
                          label="Important" 
                          color="error" 
                          size="small" 
                        />
                      )}
                      {isExpired(notice.expiryDate) && (
                        <Chip 
                          label="Expired" 
                          color="default" 
                          size="small" 
                        />
                      )}
                    </Box>
                    
                    {(user?.role === 'SUPER_ADMIN' || (notice.postedBy && user?.id === notice.postedBy._id)) && (
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditDialogOpen(notice)}
                          aria-label="Edit notice"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteDialogOpen(notice)}
                          aria-label="Delete notice"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                    {notice.content}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Posted by: {notice.postedBy?.name || 'Unknown'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {notice.expiryDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Expires: {formatDateHuman(new Date(notice.expiryDate))}
                          </Typography>
                        </Box>
                      )}
                      
                      <Typography variant="body2" color="text.secondary">
                        Posted: {formatDateHuman(new Date(notice.createdAt))}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
      
      {/* Create Notice Dialog */}
      <Dialog open={createDialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Create New Notice</DialogTitle>
        <DialogContent dividers>
          <TextField
            name="title"
            label="Title"
            value={formData.title}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
          />
          
          <TextField
            name="content"
            label="Content"
            value={formData.content}
            onChange={handleInputChange}
            fullWidth
            required
            multiline
            rows={6}
            margin="normal"
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  name="isImportant"
                  checked={formData.isImportant}
                  onChange={handleInputChange}
                  color="error"
                />
              }
              label="Mark as Important"
            />
            
            <FormControlLabel
              control={
                <Switch
                  name="sendNotification"
                  checked={formData.sendNotification}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label="Send Notifications"
            />
            
            <DatePicker
              label="Expiry Date (Optional)"
              value={formData.expiryDate}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
              sx={{ minWidth: 200 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleCreateNotice} 
            variant="contained" 
            disabled={loading || !formData.title || !formData.content}
          >
            {loading ? 'Creating...' : 'Create Notice'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Notice Dialog */}
      <Dialog open={editDialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Notice</DialogTitle>
        <DialogContent dividers>
          <TextField
            name="title"
            label="Title"
            value={formData.title}
            onChange={handleInputChange}
            fullWidth
            required
            margin="normal"
          />
          
          <TextField
            name="content"
            label="Content"
            value={formData.content}
            onChange={handleInputChange}
            fullWidth
            required
            multiline
            rows={6}
            margin="normal"
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  name="isImportant"
                  checked={formData.isImportant}
                  onChange={handleInputChange}
                  color="error"
                />
              }
              label="Mark as Important"
            />
            
            <FormControlLabel
              control={
                <Switch
                  name="sendNotification"
                  checked={formData.sendNotification}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label="Send Notifications"
            />
            
            <DatePicker
              label="Expiry Date (Optional)"
              value={formData.expiryDate}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
              sx={{ minWidth: 200 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUpdateNotice} 
            variant="contained" 
            disabled={loading || !formData.title || !formData.content}
          >
            {loading ? 'Updating...' : 'Update Notice'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Notice Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Delete Notice</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this notice? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleDeleteNotice} 
            variant="contained" 
            color="error" 
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
} 