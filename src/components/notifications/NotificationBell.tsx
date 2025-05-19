import React, { useState, useCallback, memo, useRef, useMemo } from 'react';
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
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  useMediaQuery,
  useTheme,
  SwipeableDrawer
} from '@mui/material';
import { 
  NotificationsOutlined as NotificationsIcon,
  TaskOutlined as TaskIcon,
  NotificationsActiveOutlined as NoticeIcon,
  InfoOutlined as StatusIcon,
  DoneAll as MarkReadIcon,
  DeleteOutline as ClearIcon,
  Refresh as RefreshIcon,
  Done as DoneIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNotificationSync } from '@/hooks/useNotificationSync';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import styles from './NotificationBell.module.css';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const hasRefreshedRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState<{text: string, severity: 'success' | 'error' | 'info'} | null>(null);
  
  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (isMobile) {
      setMobileDrawerOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
    setIsMenuOpen(true);
    
    // Always refresh when opening the menu to ensure latest notifications
    if (!loading) {
      console.log('NotificationBell: Manual refresh on menu open');
      refreshNotifications().catch(err => {
        console.error('Failed to refresh notifications:', err);
        setStatusMessage({
          text: 'Failed to refresh notifications',
          severity: 'error'
        });
      });
      hasRefreshedRef.current = true;
    }
  }, [refreshNotifications, loading, isMobile]);
  
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setMobileDrawerOpen(false);
    setIsMenuOpen(false);
  }, []);
  
  const handleNotificationClick = useCallback(async (notification: any) => {
    try {
      // First mark as read on server to ensure persistence
      await markAsReadOnServer(notification.id);
      
      // Then update local state
      markAsRead(notification.id);
      
      // Navigate to link if available
      if (notification.link) {
        router.push(notification.link);
      }
      
      handleClose();

      // Show success message
      setStatusMessage({
        text: 'Notification marked as read',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error handling notification click:', error);
      setStatusMessage({
        text: 'Failed to mark notification as read',
        severity: 'error'
      });
    }
  }, [markAsRead, markAsReadOnServer, router, handleClose]);
  
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // First mark all as read on server
      await markAllAsReadOnServer();
      
      // Then update local state
      markAllAsRead();
      
      setStatusMessage({
        text: 'All notifications marked as read',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      setStatusMessage({
        text: 'Failed to mark all notifications as read',
        severity: 'error'
      });
    }
  }, [markAllAsRead, markAllAsReadOnServer]);
  
  const handleRefresh = useCallback(async () => {
    try {
      console.log('NotificationBell: Manual refresh button clicked');
      await refreshNotifications();
      
      setStatusMessage({
        text: 'Notifications refreshed',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setStatusMessage({
        text: 'Failed to refresh notifications',
        severity: 'error'
      });
    }
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
  
  // Handle clearing notifications
  const handleClearNotifications = useCallback(async () => {
    try {
      console.log('Clearing all notifications from server and local state');
      
      // First delete notifications from server
      const response = await fetch('/api/notify?all=true', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error when clearing notifications:', errorText);
        throw new Error('Failed to clear notifications from server');
      }
      
      // Then clear local state
      clearNotifications();
      
      // Close the menu
      handleClose();
      
      setStatusMessage({
        text: 'All notifications cleared',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setStatusMessage({
        text: 'Failed to clear notifications',
        severity: 'error'
      });
    }
  }, [clearNotifications, handleClose]);
  
  // Close status message
  const handleCloseStatusMessage = () => {
    setStatusMessage(null);
  };
  
  // Format last sync time
  const lastSyncText = lastSyncTime
    ? `Last updated ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
    : 'Not synced yet';
  
  // Sort notifications - unread first, then by date
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      // First sort by read status (unread first)
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications]);

  // Create notification content items as an array for Menu
  const notificationItems = [
    // Header with actions
    <Box 
      key="notification-header"
      sx={{ 
        px: isMobile ? 1.5 : 2, 
        py: 1.5, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        bgcolor: theme.palette.background.paper,
        zIndex: 1,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1rem' }}>
        Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
      </Typography>
      <Box>
        <Tooltip title="Refresh">
          <IconButton 
            size="small" 
            onClick={handleRefresh}
            disabled={loading}
            sx={{ mr: 0.5 }}
          >
            {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Mark all as read">
          <IconButton 
            size="small" 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || loading}
            sx={{ mr: 0.5 }}
          >
            <MarkReadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear all">
          <IconButton 
            size="small" 
            onClick={handleClearNotifications}
            disabled={notifications.length === 0 || loading}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isMobile && (
          <Tooltip title="Close">
            <IconButton 
              size="small" 
              onClick={handleClose}
              sx={{ ml: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  ];
  
  // Error message if there is one
  if (error) {
    notificationItems.push(
      <Box key="notification-error" sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }
  
  // Loading state
  if (loading && notifications.length === 0) {
    notificationItems.push(
      <Box key="notification-loading" sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  // Empty state
  if (!loading && notifications.length === 0) {
    notificationItems.push(
      <Box 
        key="notification-empty"
        sx={{ 
          p: 4, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isMobile ? '40vh' : 'auto'
        }}
      >
        <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          No notifications
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          You're all caught up!
        </Typography>
      </Box>
    );
  }
  
  // Notification list
  if (sortedNotifications.length > 0) {
    // Create flat array for notification items and dividers
    const listItems: React.ReactNode[] = [];
    
    sortedNotifications.forEach((notification, index) => {
      // Add the menu item
      listItems.push(
        <MenuItem 
          key={`notification-${notification.id}`}
          onClick={() => handleNotificationClick(notification)}
          className={styles.touchFeedback}
          sx={{ 
            py: 1.5,
            backgroundColor: !notification.read 
              ? theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.04)'
              : 'transparent',
            position: 'relative',
            '&::before': !notification.read ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: theme.palette.primary.main,
              borderTopLeftRadius: '4px',
              borderBottomLeftRadius: '4px'
            } : {}
          }}
        >
          <Stack direction="row" spacing={1} width="100%">
            <ListItemIcon sx={{ 
              minWidth: { xs: '32px', sm: '40px' },
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              mt: 0.5
            }}>
              {getNotificationIcon(notification.type)}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="body2" sx={{ 
                  fontWeight: !notification.read ? 'bold' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  {notification.title}
                  {!notification.read && (
                    <Box component="span" sx={{ 
                      ml: 1, 
                      px: 0.75, 
                      py: 0.25, 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap'
                    }}
                    className={styles.newBadge}
                    >
                      <DoneIcon sx={{ fontSize: '0.75rem', mr: 0.25 }} />
                      NEW
                    </Box>
                  )}
                </Typography>
              }
              secondary={
                <Box component="span">
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    component="span" 
                    className={styles.notificationMessage}
                  >
                    {notification.message}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mt: 0.5,
                    justifyContent: 'space-between'
                  }} component="span">
                    <Typography 
                      variant="caption" 
                      color="textSecondary" 
                      component="span"
                    >
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </Typography>
                    {notification.read && (
                      <Box component="span" sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        color: 'success.main',
                        fontSize: '0.75rem'
                      }}>
                        <DoneIcon sx={{ fontSize: '0.75rem', mr: 0.25 }} />
                        Read
                      </Box>
                    )}
                  </Box>
                </Box>
              }
              sx={{ m: 0 }}
            />
          </Stack>
        </MenuItem>
      );
      
      // Add divider if not the last item
      if (index < sortedNotifications.length - 1) {
        listItems.push(
          <Divider key={`divider-${notification.id}`} />
        );
      }
    });
    
    // Add the list container to the notificationItems
    notificationItems.push(
      <Box 
        key="notification-list"
        sx={{ maxHeight: isMobile ? '70vh' : 'auto', overflow: 'auto' }}
        className={styles.notificationList}
      >
        {listItems}
      </Box>
    );
  }
  
  // Footer with sync info
  notificationItems.push(
    <Box 
      key="notification-footer"
      sx={{ 
        p: 1, 
        textAlign: 'center', 
        borderTop: `1px solid ${theme.palette.divider}`,
        position: 'sticky',
        bottom: 0,
        bgcolor: theme.palette.background.paper
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {lastSyncText}
      </Typography>
    </Box>
  );
  
  return (
    <>
      <Tooltip title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
        <IconButton
          size={isMobile ? "medium" : "large"}
          color="inherit"
          onClick={handleOpen}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          data-testid="notification-bell"
          sx={{
            position: 'relative',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.1)' },
            padding: isMobile ? '10px' : '8px',  // Larger tap target on mobile
            zIndex: 1200  // Ensure it's above other elements
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                animation: unreadCount > 0 ? `${styles.pulse} 1.5s infinite` : 'none',
              }
            }}
            classes={{
              badge: unreadCount > 0 ? styles.notificationCount : ''
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      {/* Desktop dropdown menu */}
      {!isMobile && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              width: 350,
              maxHeight: 'calc(100vh - 100px)',
              mt: 1.5,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 3,
              borderRadius: 1,
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
          <div>
            {notificationItems}
          </div>
        </Menu>
      )}
      
      {/* Mobile drawer for notifications */}
      {isMobile && (
        <SwipeableDrawer
          anchor="bottom"
          open={mobileDrawerOpen}
          onClose={handleClose}
          onOpen={() => setMobileDrawerOpen(true)}
          disableSwipeToOpen={false}
          swipeAreaWidth={15}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            sx: {
              height: 'auto',
              maxHeight: '80vh',  // Slightly reduced to ensure it's not too tall
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflow: 'hidden',
              width: '100%',  // Ensure full width
              boxShadow: 3,   // Add shadow for better appearance
              position: 'fixed', // Make sure it's fixed at the bottom
              bottom: 0,
              left: 0,
              right: 0
            }
          }}
        >
          {/* Drag handle for mobile */}
          <Box 
            sx={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              p: 1 
            }}
          >
            <Box 
              sx={{ 
                width: 40, 
                height: 5, 
                borderRadius: 5, 
                backgroundColor: theme.palette.grey[300] 
              }} 
              className={styles.swipeHandle}
            />
          </Box>
          <div>
            {notificationItems}
          </div>
        </SwipeableDrawer>
      )}
      
      {/* Status message snackbar */}
      <Snackbar
        open={statusMessage !== null}
        autoHideDuration={3000}
        onClose={handleCloseStatusMessage}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: isMobile ? 'center' : 'right'
        }}
        sx={{
          bottom: isMobile ? '16px !important' : undefined,
        }}
      >
        {statusMessage && (
          <Alert
            onClose={handleCloseStatusMessage}
            severity={statusMessage.severity}
            variant="filled"
            elevation={6}
            sx={{ 
              width: '100%',
              boxShadow: 2,
              borderRadius: 1,
            }}
          >
            {statusMessage.text}
          </Alert>
        )}
      </Snackbar>
    </>
  );
});

// Add display name for React DevTools
NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;