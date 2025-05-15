import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

// Define a ServerNotification interface to match what comes from the API
interface ServerNotification {
  _id: string;
  userId: string;
  type: 'task' | 'notice' | 'status';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export const useNotificationSync = () => {
  const { user, isAuthenticated } = useAuth();
  const { addNotification, markAsRead, clearNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  // Add flag to prevent multiple fetches
  const isFetchingRef = useRef(false);

  // Function to fetch notifications from the server
  const fetchNotifications = useCallback(async () => {
    // If already fetching or not authenticated, don't fetch again
    if (isFetchingRef.current || !isAuthenticated) {
      console.log('Skip fetching notifications:', isFetchingRef.current ? 'already fetching' : 'not authenticated');
      return;
    }
    
    // Check if notifications were recently cleared
    const lastClearedTime = localStorage.getItem('notifications_last_cleared');
    if (lastClearedTime) {
      const clearTimestamp = parseInt(lastClearedTime, 10);
      // If notifications were cleared in the last 5 seconds, don't fetch yet
      if (Date.now() - clearTimestamp < 5000) {
        console.log('Skip fetching - notifications were recently cleared');
        return;
      }
    }
    
    console.log('Fetching notifications from server...');
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notify');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server responded with error:', response.status, errorText);
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Received ${data.notifications.length} notifications, unread: ${data.unreadCount}`);
        
        // Clear existing notifications first
        clearNotifications();
        
        // Add each server notification to the client state
        data.notifications.forEach((notification: ServerNotification) => {
          console.log(`Processing notification: ID=${notification._id}, Title=${notification.title}, Read=${notification.read}`);
          
          addNotification({
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            read: notification.read,
            createdAt: new Date(notification.createdAt)
          });
        });
        
        console.log('Notifications processing complete');
        setLastSyncTime(new Date());
      } else {
        console.error('Server returned failure:', data.message);
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching notifications:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      // Reset fetching flag with a small delay to prevent immediate refetches
      setTimeout(() => {
        isFetchingRef.current = false;
        console.log('Notification fetch flag reset, ready for next fetch');
      }, 1000);
    }
  }, [isAuthenticated, addNotification, clearNotifications, markAsRead]);

  // Mark a notification as read on the server
  const markAsReadOnServer = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) {
      console.log('Skip marking as read: not authenticated');
      return;
    }
    
    console.log(`Marking notification as read on server: ${notificationId}`);
    
    try {
      const response = await fetch('/api/notify/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server returned error when marking notification as read:', errorText);
        return;
      }
      
      const data = await response.json();
      console.log('Mark as read result:', data);
      
    } catch (err) {
      console.error('Error marking notification as read on server:', err);
    }
  }, [isAuthenticated]);

  // Mark all notifications as read on the server
  const markAllAsReadOnServer = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Skip marking all as read: not authenticated');
      return;
    }
    
    console.log('Marking all notifications as read on server');
    
    try {
      const response = await fetch('/api/notify/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markAll: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server returned error when marking all notifications as read:', errorText);
        return;
      }
      
      const data = await response.json();
      console.log('Mark all as read result:', data);
      
    } catch (err) {
      console.error('Error marking all notifications as read on server:', err);
    }
  }, [isAuthenticated]);

  // Fetch notifications once when the user authenticates
  useEffect(() => {
    if (isAuthenticated && !isFetchingRef.current) {
      console.log('Initial fetch of notifications');
      // Fetch on initial load and when auth state changes
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Set up periodic refresh (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    console.log('Setting up periodic notification refresh (every 5 minutes)');
    
    const intervalId = setInterval(() => {
      if (!isFetchingRef.current) {
        console.log('Periodic refresh triggered');
        fetchNotifications();
      } else {
        console.log('Skipping periodic refresh - already fetching');
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      console.log('Clearing notification refresh interval');
      clearInterval(intervalId);
    };
  }, [isAuthenticated, fetchNotifications]);

  return {
    loading,
    error,
    lastSyncTime,
    refreshNotifications: fetchNotifications,
    markAsReadOnServer,
    markAllAsReadOnServer
  };
}; 