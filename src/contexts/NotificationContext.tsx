import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Interface for notifications
export interface Notification {
  id: string;
  type: 'task' | 'notice' | 'status';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

// Notification partial type for adding notifications
export type PartialNotification = {
  id?: string;
  type: 'task' | 'notice' | 'status';
  title: string;
  message: string;
  link?: string;
  read?: boolean;
  createdAt?: Date;
};

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: PartialNotification) => void;
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

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  // Calculate unread count only when notifications change
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const loadNotifications = () => {
      // Check if notifications were recently cleared
      const lastClearedTime = localStorage.getItem('notifications_last_cleared');
      if (lastClearedTime) {
        const clearTimestamp = parseInt(lastClearedTime, 10);
        // If notifications were cleared in the last minute, don't load from localStorage
        if (Date.now() - clearTimestamp < 60000) {
          console.log('Skip loading from localStorage - notifications were recently cleared');
          return;
        }
      }
      
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        try {
          // Parse the JSON and convert date strings back to Date objects
          const parsed = JSON.parse(savedNotifications);
          
          // If the saved notifications array is empty, don't proceed
          if (!parsed || parsed.length === 0) {
            console.log('No notifications found in localStorage or empty array');
            return;
          }
          
          const notificationsWithDates = parsed.map((notif: any) => ({
            ...notif,
            createdAt: new Date(notif.createdAt)
          }));
          console.log(`Loaded ${notificationsWithDates.length} notifications from localStorage`);
          setNotifications(notificationsWithDates);
        } catch (error) {
          console.error('Error parsing notifications from localStorage:', error);
          localStorage.removeItem('notifications');
        }
      } else {
        console.log('No saved notifications found in localStorage');
      }
    };
    
    loadNotifications();
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    // Only save if there are notifications to save
    if (notifications.length > 0) {
      console.log(`Saving ${notifications.length} notifications to localStorage`);
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } else {
      // If notifications array is empty, remove from localStorage
      console.log('Removing notifications from localStorage (empty array)');
      localStorage.removeItem('notifications');
    }
  }, [notifications]);

  // Add a new notification
  const addNotification = (notification: PartialNotification) => {
    const isServerNotification = !!notification.id && !!notification.createdAt;
    
    console.log(`Adding ${isServerNotification ? 'server' : 'local'} notification:`, {
      id: notification.id || 'to be generated',
      type: notification.type,
      title: notification.title,
      read: notification.read !== undefined ? notification.read : false
    });
    
    setNotifications(prevNotifications => {
      // If this notification has an ID, check if it already exists
      if (notification.id) {
        const existingNotification = prevNotifications.find(n => n.id === notification.id);
        if (existingNotification) {
          console.log(`Notification with ID ${notification.id} already exists, updating`);
          // Update the existing notification, preserving the read status from server
          return prevNotifications.map(n => 
            n.id === notification.id 
              ? {
                  ...n,
                  type: notification.type,
                  title: notification.title,
                  message: notification.message,
                  link: notification.link !== undefined ? notification.link : n.link,
                  read: notification.read !== undefined ? notification.read : n.read,
                  createdAt: notification.createdAt || n.createdAt
                }
              : n
          );
        }
      }
      
      // Check for duplicate notifications (similar content within last minute)
      // Skip this check for server notifications which should be trusted
      if (!isServerNotification) {
        const oneMinuteAgo = new Date(Date.now() - 60000);
        const isDuplicate = prevNotifications.some(
          n => 
            n.type === notification.type &&
            n.title === notification.title &&
            n.message === notification.message &&
            n.createdAt > oneMinuteAgo
        );
        
        if (isDuplicate) {
          console.log('Skipping duplicate notification created within the last minute');
          return prevNotifications;
        }
      }
      
      // Create a new notification
      const newNotification: Notification = {
        id: notification.id || uuidv4(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: notification.read !== undefined ? notification.read : false,
        createdAt: notification.createdAt || new Date()
      };
      
      console.log('Adding new notification:', newNotification);
      return [...prevNotifications, newNotification];
    });
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    console.log(`Marking notification as read: ${id}`);
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    console.log('Marking all notifications as read');
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    console.log('Clearing all notifications');
    setNotifications([]);
    
    // Set a timestamp when notifications were cleared
    localStorage.setItem('notifications_last_cleared', Date.now().toString());
    
    // Also remove notifications from localStorage to prevent them from reappearing
    localStorage.removeItem('notifications');
  };

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