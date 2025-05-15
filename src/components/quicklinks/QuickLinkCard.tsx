"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Link,
  Divider,
  useTheme,
  Grid,
  Paper
} from '@mui/material';
import {
  OpenInNew as OpenIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Public as PublicIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import ArticleIcon from '@mui/icons-material/Article';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FolderIcon from '@mui/icons-material/Folder';
import BookIcon from '@mui/icons-material/Book';
import CloudIcon from '@mui/icons-material/Cloud';
import DevicesIcon from '@mui/icons-material/Devices';
import EventIcon from '@mui/icons-material/Event';
import EmailIcon from '@mui/icons-material/Email';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import StorageIcon from '@mui/icons-material/Storage';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '@/contexts/AuthContext';

// Helper to dynamically get the icon
const DynamicIcon = ({ iconName, ...props }) => {
  const iconMap = {
    'link': LinkIcon,
    'description': DescriptionIcon,
    'article': ArticleIcon,
    'home': HomeIcon,
    'info': InfoIcon,
    'help': HelpIcon,
    'work': WorkIcon,
    'star': StarIcon,
    'favorite': FavoriteIcon,
    'bookmark': BookmarkIcon,
    'folder': FolderIcon,
    'book': BookIcon,
    'cloud': CloudIcon,
    'device': DevicesIcon,
    'event': EventIcon,
    'email': EmailIcon,
    'people': PeopleIcon,
    'school': SchoolIcon,
    'storage': StorageIcon,
    'security': SecurityIcon,
    'settings': SettingsIcon,
    'dashboard': DashboardIcon,
    'document': DescriptionIcon
  };
  
  const IconComponent = iconMap[iconName?.toLowerCase()] || LinkIcon;
  return <IconComponent {...props} />;
};

interface QuickLinkCardProps {
  link: any;
  onEdit: (link: any) => void;
  onDelete: (linkId: string) => void;
  listMode?: boolean;
}

const QuickLinkCard: React.FC<QuickLinkCardProps> = ({ 
  link, 
  onEdit, 
  onDelete,
  listMode = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  
  // Check if user can edit (owner or super admin)
  const canEdit = user && (
    user.userId === link.userId || 
    user.role === 'SUPER_ADMIN'
  );
  
  // Open menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Close menu
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle edit
  const handleEdit = () => {
    handleMenuClose();
    onEdit(link);
  };
  
  // Handle delete with confirmation
  const handleDelete = () => {
    handleMenuClose();
    if (window.confirm('Are you sure you want to delete this link?')) {
      onDelete(link._id);
    }
  };
  
  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleMenuClose();
  };
  
  // Format link URL for display
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  };
  
  // List mode display (horizontal card)
  if (listMode) {
    return (
      <Paper
        elevation={1}
        sx={{
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 3
          }
        }}
      >
        <Grid container alignItems="center">
          <Grid item xs={12} sm={8} md={9}>
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center'
            }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: link.color || theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                <DynamicIcon 
                  iconName={link.icon || 'Link'}
                  sx={{ color: '#fff', fontSize: 20 }}
                />
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 'bold' }}>
                    {link.title}
                  </Typography>
                  
                  {link.isPublic && (
                    <Tooltip title="Public link">
                      <PublicIcon color="disabled" sx={{ ml: 1, fontSize: 16 }} />
                    </Tooltip>
                  )}
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {link.description || formatUrl(link.url)}
                </Typography>
                
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label={link.category || 'General'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener"
                    underline="hover"
                    color="primary"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: '0.75rem'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatUrl(link.url)}
                    <OpenIcon sx={{ ml: 0.5, fontSize: 12 }} />
                  </Link>
                </Box>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              p: 2,
              borderTop: { xs: `1px solid ${theme.palette.divider}`, sm: 'none' }
            }}>
              <Tooltip title="Open Link">
                <IconButton
                  component="a"
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                >
                  <OpenIcon />
                </IconButton>
              </Tooltip>
              
              {canEdit && (
                <Tooltip title="Edit">
                  <IconButton onClick={handleEdit}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="More Options">
                <IconButton onClick={handleMenuOpen}>
                  <MoreIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleCopyLink}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {copied ? 'Copied!' : 'Copy URL'}
            </ListItemText>
          </MenuItem>
          
          {canEdit && (
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          )}
          
          {canEdit && (
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </Paper>
    );
  }
  
  // Grid mode display (vertical card)
  return (
    <Card
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3
        }
      }}
    >
      {/* Card header with icon */}
      <Box
        sx={{
          p: 2,
          backgroundColor: link.color || theme.palette.primary.main,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <DynamicIcon 
          iconName={link.icon || 'Link'}
          sx={{ color: '#fff', fontSize: 28 }}
        />
        
        <Box>
          {link.isPublic && (
            <Tooltip title="Public link">
              <PublicIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 20 }} />
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {link.title}
        </Typography>
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '4.5em'
          }}
        >
          {link.description || formatUrl(link.url)}
        </Typography>
        
        <Box sx={{ mt: 'auto' }}>
          <Chip
            label={link.category || 'General'}
            size="small"
            sx={{ mb: 1 }}
          />
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Link
              href={link.url}
              target="_blank"
              rel="noopener"
              underline="hover"
              color="primary"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '0.75rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {formatUrl(link.url)}
              <OpenIcon sx={{ ml: 0.5, fontSize: 12 }} />
            </Link>
          </Box>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions>
        <Tooltip title="Open Link">
          <IconButton
            component="a"
            href={link.url}
            target="_blank"
            rel="noopener"
            size="small"
          >
            <OpenIcon />
          </IconButton>
        </Tooltip>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {canEdit && (
          <Tooltip title="Edit">
            <IconButton onClick={handleEdit} size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="More Options">
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {copied ? 'Copied!' : 'Copy URL'}
          </ListItemText>
        </MenuItem>
        
        {canEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        
        {canEdit && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default QuickLinkCard; 