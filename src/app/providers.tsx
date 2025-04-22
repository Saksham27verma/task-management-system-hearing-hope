'use client';

import { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useThemeMode } from '@/contexts/ThemeContext';
import { getTheme } from '@/lib/theme';
import { DashboardLoadingProvider } from './dashboard-loading';

// Wrapper to use the theme context
function ThemeWrapper({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();
  const theme = getTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeWrapper>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthProvider>
            <DashboardLoadingProvider>
              {children}
            </DashboardLoadingProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeWrapper>
    </ThemeProvider>
  );
} 