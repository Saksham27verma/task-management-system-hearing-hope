"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Button, 
  Typography,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import QuickLinkDialog from './QuickLinkDialog';
import QuickLinkCard from './QuickLinkCard';
import QuickLinkGrid from './QuickLinkGrid';
import { useAuth } from '@/contexts/AuthContext';

const QuickLinksManager = () => {
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fetch links
  const fetchLinks = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/quicklinks');
      const data = await response.json();
      
      if (data.success) {
        setLinks(data.links);
        
        // Extract unique categories
        const uniqueCategories = ['All'];
        data.links.forEach(link => {
          if (link.category && !uniqueCategories.includes(link.category)) {
            uniqueCategories.push(link.category);
          }
        });
        
        setCategories(uniqueCategories);
      } else {
        setError(data.message || 'Failed to fetch links');
      }
    } catch (err) {
      console.error('Error fetching links:', err);
      setError('Failed to load links. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchLinks();
  }, []);
  
  // Handle category change
  const handleCategoryChange = (event, newCategory) => {
    setSelectedCategory(newCategory);
  };
  
  // Filter links by category
  const filteredLinks = selectedCategory === 'All' 
    ? links 
    : links.filter(link => link.category === selectedCategory);
  
  // Open dialog for creating a new link
  const handleCreateLink = () => {
    setEditingLink(null);
    setOpenDialog(true);
  };
  
  // Open dialog for editing an existing link
  const handleEditLink = (link) => {
    setEditingLink(link);
    setOpenDialog(true);
  };
  
  // Close dialog
  const handleCloseDialog = (refreshNeeded = false) => {
    setOpenDialog(false);
    if (refreshNeeded) {
      fetchLinks();
    }
  };
  
  // Delete a link
  const handleDeleteLink = async (linkId) => {
    try {
      const response = await fetch(`/api/quicklinks/${linkId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchLinks();
      } else {
        setError(data.message || 'Failed to delete link');
      }
    } catch (err) {
      console.error('Error deleting link:', err);
      setError('Failed to delete link. Please try again.');
    }
  };
  
  // Toggle view mode
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };
  
  return (
    <Box>
      {/* Controls section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        mb: 3
      }}>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateLink}
            sx={{ mr: 2 }}
          >
            Add New Link
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchLinks}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        <Tabs
          value={viewMode}
          onChange={handleViewModeChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab value="grid" label="Grid View" />
          <Tab value="list" label="List View" />
        </Tabs>
      </Box>
      
      {/* Category tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          indicatorColor="primary"
          textColor="primary"
        >
          {categories.map(category => (
            <Tab key={category} value={category} label={category} />
          ))}
        </Tabs>
      </Box>
      
      {/* Error message */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* No links message */}
          {filteredLinks.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              No links found in this category. Click "Add New Link" to create one.
            </Typography>
          ) : (
            // Display links based on view mode
            viewMode === 'grid' ? (
              <QuickLinkGrid 
                links={filteredLinks}
                onEdit={handleEditLink}
                onDelete={handleDeleteLink}
              />
            ) : (
              <Box>
                {filteredLinks.map(link => (
                  <QuickLinkCard
                    key={link._id}
                    link={link}
                    onEdit={handleEditLink}
                    onDelete={handleDeleteLink}
                    listMode={true}
                  />
                ))}
              </Box>
            )
          )}
        </>
      )}
      
      {/* Dialog for adding/editing links */}
      <QuickLinkDialog
        open={openDialog}
        onClose={handleCloseDialog}
        link={editingLink}
        categories={categories.filter(cat => cat !== 'All')}
      />
    </Box>
  );
};

export default QuickLinksManager; 