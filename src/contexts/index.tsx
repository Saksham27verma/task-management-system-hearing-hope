import React from 'react';
import { AuthProvider } from './AuthContext';
import { TaskProvider } from './TaskContext';
import { UserProvider } from './UserContext';
import { NotificationProvider } from './NotificationContext';
import { AssistantProvider } from './AssistantContext';
import { ThemeProvider } from './ThemeContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <TaskProvider>
            <NotificationProvider>
              <AssistantProvider>
                {children}
              </AssistantProvider>
            </NotificationProvider>
          </TaskProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}; 