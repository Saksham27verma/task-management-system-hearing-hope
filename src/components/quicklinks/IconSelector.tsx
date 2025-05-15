"use client";

import React from 'react';
import { Box, IconButton, Grid, Tooltip, useTheme } from '@mui/material';
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

// Helper to dynamically get an icon component by name
const DynamicIcon = ({ iconName }: { iconName: string }) => {
  // Map of icon names to components
  const iconMap: Record<string, React.ReactElement> = {
    'link': <LinkIcon />,
    'description': <DescriptionIcon />,
    'article': <ArticleIcon />,
    'home': <HomeIcon />,
    'info': <InfoIcon />,
    'help': <HelpIcon />,
    'work': <WorkIcon />,
    'star': <StarIcon />,
    'favorite': <FavoriteIcon />,
    'bookmark': <BookmarkIcon />,
    'folder': <FolderIcon />,
    'book': <BookIcon />,
    'cloud': <CloudIcon />,
    'device': <DevicesIcon />,
    'event': <EventIcon />,
    'email': <EmailIcon />,
    'people': <PeopleIcon />,
    'school': <SchoolIcon />,
    'storage': <StorageIcon />,
    'security': <SecurityIcon />,
    'settings': <SettingsIcon />,
    'dashboard': <DashboardIcon />,
    'document': <DescriptionIcon />
  };
  
  // Return the icon or default to LinkIcon
  return iconMap[iconName.toLowerCase()] || <LinkIcon />;
};

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  icons: string[];
}

const IconSelector: React.FC<IconSelectorProps> = ({ 
  selectedIcon, 
  onSelectIcon, 
  icons 
}) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      maxHeight: '200px', 
      overflowY: 'auto',
      p: 1,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 1,
      mt: 1
    }}>
      <Grid container spacing={1}>
        {icons.map(icon => (
          <Grid item key={icon}>
            <Tooltip title={icon.charAt(0).toUpperCase() + icon.slice(1)}>
              <IconButton
                onClick={() => onSelectIcon(icon)}
                color={selectedIcon === icon ? 'primary' : 'default'}
                sx={{ 
                  border: selectedIcon === icon 
                    ? `2px solid ${theme.palette.primary.main}` 
                    : '2px solid transparent',
                  borderRadius: 1,
                  p: 1
                }}
                size="small"
              >
                <DynamicIcon iconName={icon} />
              </IconButton>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default IconSelector; 