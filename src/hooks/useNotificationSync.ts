import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

export const useNotificationSync = () => {
  const { user, isAuthenticated } = useAuth();
  const { notifications, addNotification, clearNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  // Add flag to prevent multiple fetches
  const isFetchingRef = useRef(false);

  // Function to fetch notifications from the server
  const fetchNotifications = useCallback(async () => {
    // If already fetching or not authenticated, don't fetch again
    if (isFetchingRef.current || !isAuthenticated) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notify');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Clear existing notifications first
        clearNotifications();
        
        // Add each server notification to the client state
        data.notifications.forEach((notification: any) => {
          addNotification({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link || undefined
          });
        });
        
        setLastSyncTime(new Date());
      } else {
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      // Reset fetching flag with a small delay to prevent immediate refetches
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 1000);
    }
  }, [isAuthenticated, addNotification, clearNotifications]);

  // Mark a notification as read on the server
  const markAsReadOnServer = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) return;
    
    try {
      await fetch('/api/notify/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      });
    } catch (err) {
      console.error('Error marking notification as read on server:', err);
    }
  }, [isAuthenticated]);

  // Mark all notifications as read on the server
  const markAllAsReadOnServer = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      await fetch('/api/notify/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markAll: true
        })
      });
    } catch (err) {
      console.error('Error marking all notifications as read on server:', err);
    }
  }, [isAuthenticated]);

  // Fetch notifications once when the user authenticates
  useEffect(() => {
    if (isAuthenticated && !isFetchingRef.current && !lastSyncTime) {
      // Only fetch on first mount, not on every auth state change
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications, lastSyncTime]);

  return {
    loading,
    error,
    lastSyncTime,
    refreshNotifications: fetchNotifications,
    markAsReadOnServer,
    markAllAsReadOnServer
  };
}; 