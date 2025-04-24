'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Business as BusinessIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

// Define types for company information
interface SocialLink {
  platform: string;
  url: string;
}

interface Company {
  _id: string;
  name: string;
  description: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  logoUrl?: string;
  socialLinks: SocialLink[];
}

export default function CompanyPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompany, setEditedCompany] = useState<Company | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addSocialDialogOpen, setAddSocialDialogOpen] = useState(false);
  const [newSocialLink, setNewSocialLink] = useState<SocialLink>({
    platform: 'Facebook',
    url: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Fetch company information on component mount
  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/company');
      
      if (!response.ok) {
        throw new Error('Failed to fetch company information');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCompany(data.company);
      } else {
        throw new Error(data.message || 'Failed to fetch company information');
      }
    } catch (error: any) {
      console.error('Error fetching company information:', error);
      setError(error.message || 'An error occurred while fetching company information');
      
      // Remove mock data to ensure we're only using real data
      // If you need to create initial company data, run the seed script instead
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditedCompany({ ...company! });
      setIsEditing(true);
    }
  };

  // Handle form field changes
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setEditedCompany(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  // Handle new social link changes
  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setNewSocialLink(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add social link dialog
  const handleOpenAddSocialDialog = () => {
    setNewSocialLink({
      platform: 'Facebook',
      url: ''
    });
    setAddSocialDialogOpen(true);
  };

  // Handle adding new social link
  const handleAddSocialLink = () => {
    if (!newSocialLink.url) return;
    
    setEditedCompany(prev => {
      if (!prev) return null;
      return {
        ...prev,
        socialLinks: [...prev.socialLinks, newSocialLink]
      };
    });
    
    setAddSocialDialogOpen(false);
  };

  // Handle removing social link
  const handleRemoveSocialLink = (index: number) => {
    setEditedCompany(prev => {
      if (!prev) return null;
      
      const updatedLinks = [...prev.socialLinks];
      updatedLinks.splice(index, 1);
      
      return {
        ...prev,
        socialLinks: updatedLinks
      };
    });
  };

  // Handle save company information
  const handleSaveCompany = async () => {
    if (!editedCompany) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedCompany)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCompany(editedCompany);
        setIsEditing(false);
        setSnackbar({
          open: true,
          message: 'Company information updated successfully',
          severity: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to update company information');
      }
    } catch (error: any) {
      console.error('Error saving company information:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred while saving company information',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get icon for social platform
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <FacebookIcon />;
      case 'twitter':
        return <TwitterIcon />;
      case 'instagram':
        return <InstagramIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
      case 'youtube':
        return <YouTubeIcon />;
      default:
        return <WebsiteIcon />;
    }
  };

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Company Information
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage organization details and contact information
        </Typography>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : company ? (
        <Grid container spacing={3}>
          {/* Company overview card */}
          <Grid size={{ xs: 12 }} component="div">
            <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
              {isSuperAdmin && (
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                  <Button
                    variant={isEditing ? 'outlined' : 'contained'}
                    color={isEditing ? 'error' : 'primary'}
                    startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                    onClick={isEditing ? handleSaveCompany : handleEditToggle}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <CircularProgress size={24} />
                    ) : isEditing ? (
                      'Save Changes'
                    ) : (
                      'Edit Information'
                    )}
                  </Button>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={company.logoUrl}
                  alt={company.name}
                  sx={{
                    width: 80,
                    height: 80,
                    mr: 2,
                    bgcolor: 'primary.main'
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 40 }} />
                </Avatar>
                
                {isEditing ? (
                  <TextField
                    name="name"
                    label="Company Name"
                    value={editedCompany?.name || ''}
                    onChange={handleFieldChange}
                    fullWidth
                    variant="standard"
                    sx={{ fontSize: '1.5rem' }}
                  />
                ) : (
                  <Typography variant="h4" component="h2">
                    {company.name}
                  </Typography>
                )}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                About Us
              </Typography>
              
              {isEditing ? (
                <TextField
                  name="description"
                  label="Company Description"
                  value={editedCompany?.description || ''}
                  onChange={handleFieldChange}
                  fullWidth
                  multiline
                  rows={4}
                  margin="normal"
                />
              ) : (
                <Typography variant="body1" paragraph>
                  {company.description}
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Contact information card */}
          <Grid size={{ xs: 12, md: 6 }} component="div">
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PlaceIcon color="primary" />
                  </ListItemIcon>
                  {isEditing ? (
                    <TextField
                      name="address"
                      label="Address"
                      value={editedCompany?.address || ''}
                      onChange={handleFieldChange}
                      fullWidth
                      multiline
                      rows={2}
                    />
                  ) : (
                    <ListItemText primary="Address" secondary={company.address} />
                  )}
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  {isEditing ? (
                    <TextField
                      name="phone"
                      label="Phone Number"
                      value={editedCompany?.phone || ''}
                      onChange={handleFieldChange}
                      fullWidth
                    />
                  ) : (
                    <ListItemText primary="Phone" secondary={company.phone} />
                  )}
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  {isEditing ? (
                    <TextField
                      name="email"
                      label="Email Address"
                      value={editedCompany?.email || ''}
                      onChange={handleFieldChange}
                      fullWidth
                    />
                  ) : (
                    <ListItemText primary="Email" secondary={company.email} />
                  )}
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <WebsiteIcon color="primary" />
                  </ListItemIcon>
                  {isEditing ? (
                    <TextField
                      name="website"
                      label="Website URL"
                      value={editedCompany?.website || ''}
                      onChange={handleFieldChange}
                      fullWidth
                    />
                  ) : (
                    <ListItemText 
                      primary="Website" 
                      secondary={
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'inherit' }}
                        >
                          {company.website}
                        </a>
                      } 
                    />
                  )}
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          {/* Social media links card */}
          <Grid size={{ xs: 12, md: 6 }} component="div">
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Social Media
                </Typography>
                
                {isEditing && (
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                    onClick={handleOpenAddSocialDialog}
                  >
                    Add Link
                  </Button>
                )}
              </Box>
              
              {company.socialLinks.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
                  No social media links available
                </Typography>
              ) : (
                <List>
                  {(isEditing ? editedCompany?.socialLinks : company.socialLinks).map((link, index) => (
                    <React.Fragment key={link.platform + index}>
                      <ListItem
                        secondaryAction={
                          isEditing && (
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => handleRemoveSocialLink(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemIcon>
                          {getSocialIcon(link.platform)}
                        </ListItemIcon>
                        <ListItemText
                          primary={link.platform}
                          secondary={
                            isEditing ? (
                              link.url
                            ) : (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'inherit' }}
                              >
                                {link.url}
                              </a>
                            )
                          }
                        />
                      </ListItem>
                      {index < company.socialLinks.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">
          No company information available
        </Alert>
      )}
      
      {/* Add social media dialog */}
      <Dialog open={addSocialDialogOpen} onClose={() => setAddSocialDialogOpen(false)}>
        <DialogTitle>Add Social Media Link</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              select
              name="platform"
              label="Platform"
              value={newSocialLink.platform}
              onChange={handleSocialLinkChange}
              fullWidth
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              {['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'YouTube', 'Other'].map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </TextField>
            
            <TextField
              name="url"
              label="URL"
              value={newSocialLink.url}
              onChange={handleSocialLinkChange}
              fullWidth
              margin="normal"
              placeholder="https://"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSocialDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddSocialLink} 
            variant="contained" 
            color="primary"
            disabled={!newSocialLink.url}
          >
            Add
          </Button>
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