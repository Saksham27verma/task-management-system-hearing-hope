"use client";

import React from 'react';
import { Box, IconButton, Grid, Tooltip, useTheme } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  colors: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ 
  selectedColor, 
  onSelectColor, 
  colors 
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
        {colors.map(color => {
          const isSelected = selectedColor === color;
          
          return (
            <Grid item key={color}>
              <Tooltip title={color}>
                <IconButton
                  onClick={() => onSelectColor(color)}
                  sx={{ 
                    bgcolor: color,
                    width: 36,
                    height: 36,
                    border: isSelected 
                      ? `2px solid ${theme.palette.text.primary}` 
                      : `2px solid transparent`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: color,
                      opacity: 0.9,
                      transform: 'scale(1.1)'
                    }
                  }}
                  size="small"
                  disableRipple
                >
                  {isSelected && <CheckIcon sx={{ color: 'white' }} />}
                </IconButton>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ColorPicker; 