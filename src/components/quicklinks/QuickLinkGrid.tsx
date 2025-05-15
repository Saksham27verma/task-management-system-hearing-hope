"use client";

import React from 'react';
import { Grid, Box, useMediaQuery, useTheme } from '@mui/material';
import QuickLinkCard from './QuickLinkCard';

interface QuickLinkGridProps {
  links: any[];
  onEdit: (link: any) => void;
  onDelete: (linkId: string) => void;
}

const QuickLinkGrid: React.FC<QuickLinkGridProps> = ({ links, onEdit, onDelete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        {links.map(link => (
          <Grid key={link._id} item xs={12} sm={6} md={4} lg={3}>
            <QuickLinkCard
              link={link}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuickLinkGrid; 