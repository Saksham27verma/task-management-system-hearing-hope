import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'task' | 'notice' | 'status';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  // Calculate unread count only when notifications change
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // TEMPORARILY COMMENTED OUT - localStorage operations may be causing issues
  // Load notifications from localStorage on mount or when user changes
  /*
  useEffect(() => {
    if (user) {
      try {
        const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
        if (savedNotifications) {
          const parsed = JSON.parse(savedNotifications);
          // Convert string dates back to Date objects
          const notificationsWithDates = parsed.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt)
          }));
          setNotifications(notificationsWithDates);
        }
      } catch (error) {
        console.error('Failed to parse notifications from localStorage', error);
      }
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
    }
  }, [user]);
  */

  // TEMPORARILY COMMENTED OUT - localStorage operations may be causing issues
  // Save notifications to localStorage when they change, but debounce to avoid too many updates
  /*
  useEffect(() => {
    if (!user) return;
    
    // Only save if we have notifications and a user
    if (user && notifications.length > 0) {
      // Use a timeout to debounce localStorage writes
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
        } catch (error) {
          console.error('Failed to save notifications to localStorage', error);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [notifications, user]);
  */

  // Just clear notifications when user changes
  useEffect(() => {
    if (!user) {
      setNotifications([]);
    }
  }, [user]);

  // Add a new notification - use callback to stabilize the function reference
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    console.log('Adding notification:', notification);
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false
    };
    
    setNotifications(prev => {
      // Check if a similar notification already exists (avoid duplicates)
      const isDuplicate = prev.some(n => 
        n.type === notification.type && 
        n.title === notification.title && 
        n.message === notification.message &&
        // Consider it a duplicate if created in the last minute
        (new Date().getTime() - new Date(n.createdAt).getTime() < 60000)
      );
      
      if (isDuplicate) {
        console.log('Duplicate notification detected - skipping');
        return prev;
      }
      
      return [newNotification, ...prev];
    });
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    // Disable localStorage operations for now
    // if (user) {
    //   localStorage.removeItem(`notifications_${user.id}`);
    // }
  }, []);

  // Memoize the context value to prevent unnecessary rerenders
  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 