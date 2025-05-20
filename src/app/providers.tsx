'use client';

import { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useThemeMode } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ConfettiProvider } from '@/contexts/ConfettiContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { UserProvider } from '@/contexts/UserContext';
import { AssistantProvider } from '@/contexts/AssistantContext';
import AssistantWidget from '@/components/assistant/AssistantWidget';
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
            <UserProvider>
              <TaskProvider>
                <NotificationProvider>
                  <ConfettiProvider>
                    <DashboardLoadingProvider>
                      <AssistantProvider>
                        {children}
                        <AssistantWidget />
                      </AssistantProvider>
                    </DashboardLoadingProvider>
                  </ConfettiProvider>
                </NotificationProvider>
              </TaskProvider>
            </UserProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeWrapper>
    </ThemeProvider>
  );
} 