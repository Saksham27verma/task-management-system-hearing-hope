import React from 'react';
import { Box, IconButton, Grid, Tooltip, useTheme } from '@mui/material';
import * as MuiIcons from '@mui/icons-material';

// Helper to dynamically get an icon component by name
const DynamicIcon = ({ iconName }: { iconName: string }) => {
  // Format the icon name to match MUI naming convention (e.g., 'link' -> 'LinkIcon')
  const formattedName = `${iconName.charAt(0).toUpperCase() + iconName.slice(1)}Icon`;
  
  // Get the icon component from MUI icons
  const IconComponent = (MuiIcons as any)[formattedName] || MuiIcons.LinkIcon;
  
  return <IconComponent />;
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