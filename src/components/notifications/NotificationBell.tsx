import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemText, 
  Typography, 
  ListItemIcon, 
  Divider, 
  Box, 
  Tooltip,
  CircularProgress 
} from '@mui/material';
import { 
  NotificationsOutlined as NotificationsIcon,
  TaskOutlined as TaskIcon,
  NotificationsActiveOutlined as NoticeIcon,
  InfoOutlined as StatusIcon,
  DoneAll as MarkReadIcon,
  DeleteOutline as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

// Memoize the notification bell component to prevent unnecessary rerenders
const NotificationBell = memo(() => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useNotifications();
  
  const {
    loading,
    error,
    lastSyncTime,
    refreshNotifications,
    markAsReadOnServer,
    markAllAsReadOnServer
  } = useNotificationSync();
  
  const router = useRouter();
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasRefreshedRef = useRef(false);
  
  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setIsMenuOpen(true);
    
    // Only refresh if we haven't already or if it's been more than 5 minutes
    const shouldRefresh = !hasRefreshedRef.current || 
      !lastSyncTime || 
      (new Date().getTime() - lastSyncTime.getTime() > 5 * 60 * 1000);
    
    if (shouldRefresh && !loading) {
      console.log('NotificationBell: Manual refresh on menu open');
      refreshNotifications();
      hasRefreshedRef.current = true;
    }
  }, [refreshNotifications, lastSyncTime, loading]);
  
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setIsMenuOpen(false);
  }, []);
  
  const handleNotificationClick = useCallback((notification: any) => {
    // Mark as read both locally and on server
    markAsRead(notification.id);
    markAsReadOnServer(notification.id);
    
    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link);
    }
    
    handleClose();
  }, [markAsRead, markAsReadOnServer, router, handleClose]);
  
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
    markAllAsReadOnServer();
  }, [markAllAsRead, markAllAsReadOnServer]);
  
  const handleRefresh = useCallback(() => {
    console.log('NotificationBell: Manual refresh button clicked');
    refreshNotifications();
  }, [refreshNotifications]);
  
  // Get appropriate icon for notification type - memoize for performance
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'task':
        return <TaskIcon color="primary" fontSize="small" />;
      case 'notice':
        return <NoticeIcon color="info" fontSize="small" />;
      case 'status':
        return <StatusIcon color="success" fontSize="small" />;
      default:
        return <NotificationsIcon color="primary" fontSize="small" />;
    }
  }, []);
  
  // Format last sync time
  const lastSyncText = lastSyncTime
    ? `Last updated ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
    : 'Not synced yet';
  
  // Don't set up auto-refresh - only manual refresh now
  
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          size="large"
          color="inherit"
          onClick={handleOpen}
          sx={{
            mr: 2,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.1)' },
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                animation: unreadCount > 0 ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.2)' },
                  '100%': { transform: 'scale(1)' },
                },
              }
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
            mt: 1.5,
            overflow: 'auto',
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton 
                size="small" 
                onClick={handleRefresh}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Mark all as read">
              <IconButton 
                size="small" 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0 || loading}
                sx={{ mr: 1 }}
              >
                <MarkReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear all">
              <IconButton 
                size="small" 
                onClick={clearNotifications}
                disabled={notifications.length === 0 || loading}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider />
        
        {error && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
        
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <MenuItem 
                onClick={() => handleNotificationClick(notification)}
                sx={{ 
                  py: 1.5,
                  backgroundColor: !notification.read 
                    ? theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.04)'
                    : 'transparent'
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: !notification.read ? 'bold' : 'normal' }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="caption" color="textSecondary" component="span" sx={{ display: 'block' }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </MenuItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              No notifications
            </Typography>
          </Box>
        )}
        
        <Divider />
        
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            {lastSyncText}
          </Typography>
        </Box>
      </Menu>
    </>
  );
});

// Add display name for React DevTools
NotificationBell.displayName = 'NotificationBell';

export default NotificationBell; 