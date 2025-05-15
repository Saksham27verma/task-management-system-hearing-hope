"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  Grid,
  Chip,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Link as LinkIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Label as LabelIcon,
  Public as PublicIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import IconSelector from './IconSelector';
import ColorPicker from './ColorPicker';

// Icon options
const DEFAULT_ICONS = [
  'link', 'description', 'article', 'home', 'info', 'help', 
  'work', 'star', 'favorite', 'bookmark', 'folder', 'book',
  'cloud', 'device', 'event', 'email', 'people', 'school', 
  'storage', 'security', 'settings', 'dashboard', 'document'
];

// Color options
const DEFAULT_COLORS = [
  '#1976d2', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#607d8b'
];

const QuickLinkDialog = ({ open, onClose, link, categories = [] }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'General',
    icon: 'link',
    color: '#1976d2',
    isPublic: false
  });
  const [newCategory, setNewCategory] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState(['General']);
  
  // Initialize form data when editing
  useEffect(() => {
    if (link) {
      setFormData({
        title: link.title || '',
        url: link.url || '',
        description: link.description || '',
        category: link.category || 'General',
        icon: link.icon || 'link',
        color: link.color || '#1976d2',
        isPublic: link.isPublic || false
      });
    } else {
      // Reset form for new link
      setFormData({
        title: '',
        url: '',
        description: '',
        category: 'General',
        icon: 'link',
        color: '#1976d2',
        isPublic: false
      });
    }
    
    // Combine available categories
    setAvailableCategories([
      'General', 
      ...new Set([...categories].filter(cat => cat !== 'All'))
    ]);
  }, [link, categories]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isPublic' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: null}));
    }
  };
  
  // Handle icon selection
  const handleIconChange = (icon) => {
    setFormData(prev => ({...prev, icon}));
  };
  
  // Handle color selection
  const handleColorChange = (color) => {
    setFormData(prev => ({...prev, color}));
  };
  
  // Handle new category
  const handleAddCategory = () => {
    if (newCategory && !availableCategories.includes(newCategory)) {
      setAvailableCategories(prev => [...prev, newCategory]);
      setFormData(prev => ({...prev, category: newCategory}));
      setNewCategory('');
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // URL validation helper
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const url = link 
        ? `/api/quicklinks/${link._id}` 
        : '/api/quicklinks';
      
      const method = link ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        onClose(true); // Close with refresh
      } else {
        setErrors({submit: data.message || 'Failed to save link'});
      }
    } catch (err) {
      console.error('Error saving link:', err);
      setErrors({submit: 'Failed to save link. Please try again.'});
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center' 
      }}>
        <Typography variant="h6">
          {link ? 'Edit Quick Link' : 'Add New Quick Link'}
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={() => onClose(false)}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Left column */}
          <Grid item xs={12} md={8}>
            <TextField
              autoFocus
              margin="dense"
              id="title"
              name="title"
              label="Title"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={handleChange}
              error={Boolean(errors.title)}
              helperText={errors.title}
              required
              InputProps={{
                startAdornment: <LabelIcon color="action" sx={{ mr: 1 }} />
              }}
            />
            
            <TextField
              margin="dense"
              id="url"
              name="url"
              label="URL"
              type="url"
              fullWidth
              variant="outlined"
              value={formData.url}
              onChange={handleChange}
              error={Boolean(errors.url)}
              helperText={errors.url}
              required
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: <LinkIcon color="action" sx={{ mr: 1 }} />
              }}
            />
            
            <TextField
              margin="dense"
              id="description"
              name="description"
              label="Description"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={formData.description}
              onChange={handleChange}
              sx={{ mt: 2 }}
              InputProps={{
                startAdornment: (
                  <DescriptionIcon color="action" sx={{ mr: 1, alignSelf: 'flex-start', mt: 1 }} />
                )
              }}
            />
            
            <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                  startAdornment={<CategoryIcon color="action" sx={{ mr: 1 }} />}
                >
                  {availableCategories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                margin="dense"
                id="newCategory"
                name="newCategory"
                label="New Category"
                type="text"
                variant="outlined"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                sx={{ flexGrow: 1 }}
                InputProps={{
                  endAdornment: (
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={handleAddCategory}
                      disabled={!newCategory.trim()}
                    >
                      Add
                    </Button>
                  )
                }}
              />
            </Box>
          </Grid>
          
          {/* Right column */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Appearance
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Icon
              </Typography>
              <IconSelector
                selectedIcon={formData.icon}
                onSelectIcon={handleIconChange}
                icons={DEFAULT_ICONS}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Color
              </Typography>
              <ColorPicker
                selectedColor={formData.color}
                onSelectColor={handleColorChange}
                colors={DEFAULT_COLORS}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={handleChange}
                    name="isPublic"
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PublicIcon sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Make Public</Typography>
                  </Box>
                }
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Public links are visible to all team members
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Error message */}
        {errors.submit && (
          <Typography color="error" sx={{ mt: 2 }}>
            {errors.submit}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={() => onClose(false)} 
          color="inherit"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Saving...' : link ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickLinkDialog; 