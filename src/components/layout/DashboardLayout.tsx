import React, { useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  alpha,
  Button,
  SwipeableDrawer,
  Paper,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon,
  AssignmentOutlined as TaskIcon,
  NotificationsOutlined as NoticeIcon,
  EmailOutlined as MessageIcon,
  ContactPhone as DirectoryIcon, 
  Business as CompanyIcon,
  CalendarMonth as CalendarIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  BarChart as BarChartIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Videocam as VideoIcon,
  Bookmarks as BookmarksIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeMode } from '@/contexts/ThemeContext';
import dynamic from 'next/dynamic';
import Permission from '@/components/common/Permission';
import NotificationBell from '@/components/notifications/NotificationBell';

// Dynamically import components to prevent SSR issues
const WalkthroughTour = dynamic(
  () => import('@/components/onboarding/WalkthroughTour'),
  { ssr: false }
);

// Responsive drawer width
const getDrawerWidth = (isMobile: boolean, isSmallMobile: boolean) => {
  if (isSmallMobile) return 220;
  if (isMobile) return 240;
  return 260; // Slightly narrower for desktop
};

// Main content padding based on screen size
const getContentPadding = (isMobile: boolean, isSmallMobile: boolean) => {
  if (isSmallMobile) return { xs: 1, sm: 2 };
  if (isMobile) return { xs: 2, sm: 3 };
  return { xs: 3, sm: 4 };
};

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  permissions?: string[];
  roles?: string[];
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width:360px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const drawerWidth = getDrawerWidth(isMobile, isSmallMobile);
  
  // Inject additional CSS for mobile fixes
  useEffect(() => {
    if (isMobile) {
      // Create a style element
      const mobileFixStyles = document.createElement('style');
      mobileFixStyles.id = 'mobile-fix-styles';
      mobileFixStyles.innerHTML = `
        @media (max-width: 768px) {
          /* Ensure inputs don't overflow */
          .MuiTextField-root, .MuiFormControl-root {
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Fix for task list filters */
          .MuiInputBase-root {
            min-height: 40px !important;
            font-size: 0.875rem !important;
            padding: 0 8px !important;
          }
          
          /* Task filter improvements */
          .task-filters .MuiGrid-item {
            padding: 4px !important;
          }
          
          /* Task table improvements */
          .MuiTableContainer-root {
            overflow-x: auto !important;
            width: 100% !important;
            padding: 0 !important;
          }
          
          /* Fix for select dropdown */
          .MuiSelect-select {
            padding-right: 24px !important;
          }
          
          /* Improve button sizing on mobile */
          .MuiButton-root {
            font-size: 0.875rem !important;
            padding: 6px 16px !important;
          }
          
          /* Better tap targets */
          .MuiListItem-root, .MuiMenuItem-root {
            min-height: 48px !important;
          }
          
          /* Better form layout */
          .MuiGrid-container {
            gap: 12px !important;
          }
          
          /* Improve cards on mobile */
          .MuiCard-root {
            border-radius: 12px !important;
            overflow: hidden !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          }
          
          /* Better dialog sizing */
          .MuiDialog-paper {
            margin: 16px !important;
            max-height: calc(100% - 32px) !important;
            border-radius: 12px !important;
          }
          
          /* Fix bottom navigation */
          .MuiBottomNavigation-root {
            height: 64px !important;
          }
          
          /* Improve date picker on mobile */
          .MuiPickersDay-root {
            margin: 0 2px !important;
          }
          
          /* Fix popover positioning */
          .MuiPopover-paper {
            max-width: calc(100% - 32px) !important;
          }
        }
      `;
      
      // Check if it already exists
      if (!document.getElementById('mobile-fix-styles')) {
        document.head.appendChild(mobileFixStyles);
      }
    }
    
    // Cleanup on unmount
    return () => {
      const styleEl = document.getElementById('mobile-fix-styles');
      if (styleEl) {
        document.head.removeChild(styleEl);
      }
    };
  }, [isMobile]);
  
  // Handle profile menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };
  
  // Toggle mobile navigation - make it extremely simple to avoid any issues
  const toggleMobileNav = useCallback(() => {
    setMobileOpen(prevState => !prevState);
  }, []);

  // Debug logger for mobileOpen state
  useEffect(() => {
    console.log('mobileOpen state CHANGED to:', mobileOpen);
    
    // Control body scrolling
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      console.log('mobileOpen effect cleanup, last state:', mobileOpen);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);
  
  // Navigate to profile
  const handleProfileClick = () => {
    handleMenuClose();
    router.push('/dashboard/profile');
  };
  
  // Check if a navigation item is active
  const isActive = (href: string) => {
    return pathname?.startsWith(href);
  };

  // Navigation items based on user role
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      href: user?.role === 'SUPER_ADMIN' 
        ? '/dashboard/admin' 
        : user?.role === 'MANAGER' 
          ? '/dashboard/manager' 
          : '/dashboard/employee',
      permissions: ['reports:read'],
      roles: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Tasks',
      icon: <TaskIcon />,
      href: '/dashboard/tasks',
      permissions: ['tasks:read'],
      roles: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Reports',
      icon: <BarChartIcon />,
      href: '/dashboard/reports',
      permissions: ['reports:read'],
      roles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      label: 'Calendar',
      icon: <CalendarIcon />,
      href: '/dashboard/calendar',
      permissions: ['calendar:read'],
      roles: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Quick Links',
      icon: <BookmarksIcon />,
      href: '/dashboard/quicklinks',
      roles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      label: 'Notice Board',
      icon: <NoticeIcon />,
      href: '/dashboard/notices',
      permissions: ['notices:read'],
      roles: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Messages',
      icon: <MessageIcon />,
      href: '/dashboard/messages',
      permissions: ['messages:read'],
      roles: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Meetings',
      icon: <VideoIcon />,
      href: '/dashboard/meetings',
      permissions: ['meetings:read'],
      roles: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Phone Directory',
      icon: <DirectoryIcon />,
      href: '/dashboard/directory',
      permissions: ['users:read'],
      roles: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Company Info',
      icon: <CompanyIcon />,
      href: '/dashboard/company',
      permissions: ['company:read'],
      roles: ['SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
  ];
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    (item) => user && ((item.roles && item.roles.includes(user.role)) || (item.permissions && item.permissions.length > 0))
  );

  const drawer = (
    <Box
      component="div"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Swipe handle for bottom drawer */}
      {isMobile && (
        <Box 
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '8px 0 0',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 5,
              borderRadius: 5,
              backgroundColor: theme.palette.divider,
            }}
          />
        </Box>
      )}
      
      <Toolbar 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: isMobile ? '8px 12px' : '12px',
          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : 'white',
          color: theme.palette.text.primary,
          height: isMobile ? '64px' : '64px',
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative',
        }}
      >
        {isMobile && (
          <IconButton 
            onClick={() => setMobileOpen(false)}
            size="small"
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.palette.text.secondary,
              zIndex: 10,
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'scale(1.03)'
          }
        }}>
          <Image 
            src="/images/logohope.svg" 
            alt="Hearing Hope Logo" 
            width={isMobile ? 120 : 130} 
            height={isMobile ? 40 : 44}
            style={{ 
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          />
        </Box>
      </Toolbar>
      
      {/* Mobile drawer content */}
      {isMobile ? (
        <Box sx={{ overflow: 'auto', flexGrow: 1, width: '100%' }}>
          {/* User profile section - horizontal for mobile */}
          {user && (
            <Box 
              sx={{ 
                py: 1.5, 
                px: 3, 
                display: 'flex', 
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <Avatar 
                sx={{ 
                  width: 50, 
                  height: 50, 
                  bgcolor: theme.palette.primary.main,
                  mr: 2
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.role}
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* Navigation items - list layout for mobile */}
          <List sx={{ width: '100%', pt: 1 }}>
            {filteredNavItems.map((item) => (
              <Permission key={item.href} permissions={item.permissions} roles={item.roles}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation(item.href)}
                    sx={{
                      py: 2,
                      px: 3,
                      backgroundColor: isActive(item.href) 
                        ? alpha(theme.palette.primary.main, 0.08)
                        : 'transparent',
                      borderLeft: isActive(item.href) 
                        ? `4px solid ${theme.palette.primary.main}` 
                        : '4px solid transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 48,
                        color: isActive(item.href) 
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: isActive(item.href) ? "medium" : "normal",
                            color: isActive(item.href) 
                              ? theme.palette.primary.main
                              : theme.palette.text.primary,
                          }}
                        >
                          {item.label}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </Permission>
            ))}
          </List>
        </Box>
      ) : (
        // Desktop drawer layout remains the same
        <>
          <Divider />
          
          {/* User profile section */}
          {user && (
            <Box 
              sx={{ 
                py: 1.5, 
                px: 2, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <Avatar 
                sx={{ 
                  width: 50, 
                  height: 50, 
                  bgcolor: theme.palette.primary.main,
                  mb: 1
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.role}
              </Typography>
            </Box>
          )}
          
          {/* Navigation items */}
          <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
            <List sx={{ py: 0 }}>
              {filteredNavItems.map((item) => (
                <Permission key={item.href} permissions={item.permissions} roles={item.roles}>
                  <ListItem disablePadding>
                    <ListItemButton
                      component="div"
                      selected={isActive(item.href)}
                      onClick={() => {
                        console.log("Navigation item clicked:", item.label);
                        router.push(item.href);
                      }}
                      sx={{
                        py: 1.2,
                        color: isActive(item.href) 
                          ? theme.palette.primary.main 
                          : theme.palette.text.primary,
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          borderRight: `3px solid ${theme.palette.primary.main}`,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                          }
                        },
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          color: isActive(item.href) 
                            ? theme.palette.primary.main 
                            : 'inherit',
                          minWidth: 36,
                          fontSize: '0.9rem'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body2" 
                            fontSize='0.85rem'
                            fontWeight={isActive(item.href) ? "medium" : "normal"}
                          >
                            {item.label}
                          </Typography>
                        } 
                        sx={{ my: 0 }}
                      />
                    </ListItemButton>
                  </ListItem>
                </Permission>
              ))}
            </List>
          </Box>
        </>
      )}
    </Box>
  );

  // Create a handler for navigating items
  const handleNavigation = useCallback((href: string) => {
    // Close drawer first
    setMobileOpen(false);
    
    // Then navigate after a short delay
    setTimeout(() => {
      router.push(href);
    }, 50);
  }, [router]);

  // Main content
  return (
    <Box sx={{ display: 'flex', overflow: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <CssBaseline />
      
      {/* App bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 1,
          zIndex: 1900, // Lower than drawer but higher than most content
          backgroundColor: '#EE6417', // Match the color in the screenshot (orange)
          color: 'white',
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          height: { xs: 56, sm: 64 }, 
          px: { xs: 1, sm: 3 },
          minHeight: { xs: '56px', sm: '64px' },
          position: 'relative',
        }}>
          <Box 
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={(e) => {
                // Prevent any event bubbling
                e.preventDefault();
                e.stopPropagation();
                toggleMobileNav();
              }}
              sx={{
                mr: 2, 
                padding: '10px',
                position: 'relative',
                zIndex: 1300,
                backgroundColor: 'rgba(255,255,255,0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.25)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          
          <Typography
            variant={isSmallMobile ? "subtitle1" : "h6"}
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {(() => {
              // Determine current page title
              if (pathname?.includes('/dashboard/admin')) return 'Admin Dashboard';
              if (pathname?.includes('/dashboard/manager')) return 'Manager Dashboard';
              if (pathname?.includes('/dashboard/employee')) return 'Employee Dashboard';
              if (pathname?.includes('/dashboard/tasks')) return 'Tasks';
              if (pathname?.includes('/dashboard/reports')) return 'Reports';
              if (pathname?.includes('/dashboard/calendar')) return 'Calendar';
              if (pathname?.includes('/dashboard/notices')) return 'Notice Board';
              if (pathname?.includes('/dashboard/messages')) return 'Messages';
              if (pathname?.includes('/dashboard/meetings')) return 'Meetings';
              if (pathname?.includes('/dashboard/directory')) return 'Phone Directory';
              if (pathname?.includes('/dashboard/company')) return 'Company Information';
              if (pathname?.includes('/dashboard/profile')) return 'User Profile';
              return 'Dashboard';
            })()}
          </Typography>
          
          {/* Mobile title */}
          <Typography
            variant="subtitle1"
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'block', sm: 'none' },
              textAlign: 'center',
              fontWeight: 'medium',
            }}
          >
            {(() => {
              // Determine current page title
              if (pathname?.includes('/dashboard/admin')) return 'Admin Dashboard';
              if (pathname?.includes('/dashboard/manager')) return 'Manager Dashboard';
              if (pathname?.includes('/dashboard/employee')) return 'Employee Dashboard';
              if (pathname?.includes('/dashboard/tasks')) return 'Tasks';
              if (pathname?.includes('/dashboard/reports')) return 'Reports';
              if (pathname?.includes('/dashboard/calendar')) return 'Calendar';
              if (pathname?.includes('/dashboard/notices')) return 'Notice Board';
              if (pathname?.includes('/dashboard/messages')) return 'Messages';
              if (pathname?.includes('/dashboard/meetings')) return 'Meetings';
              if (pathname?.includes('/dashboard/directory')) return 'Phone Directory';
              if (pathname?.includes('/dashboard/company')) return 'Company Information';
              if (pathname?.includes('/dashboard/profile')) return 'User Profile';
              return 'Dashboard';
            })()}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            gap: 1,
            '& .MuiIconButton-root': {
              color: 'white' // Set icon color to white to match the screenshot
            }
          }}>
            {/* Theme toggle */}
            <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton onClick={toggleTheme} size="medium">
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Notifications */}
            <NotificationBell />
            
            {/* User profile menu */}
            <IconButton 
              onClick={handleMenuOpen}
              size="medium"
              sx={{ 
                p: 0.5,
                ml: 0.5,
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'white',
                  color: '#EE6417'
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  width: 200,
                  mt: 1.5,
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <ProfileIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Navigation drawer - Mobile */}
      {isMobile && (
        <SwipeableDrawer
          anchor="bottom"
          open={mobileOpen}
          onOpen={() => setMobileOpen(true)}
          onClose={() => setMobileOpen(false)}
          disableBackdropTransition={false}
          disableDiscovery={false}
          disableSwipeToOpen={true}
          swipeAreaWidth={0}
          hysteresis={0.52}
          minFlingVelocity={450}
          ModalProps={{
            keepMounted: false,
          }}
          PaperProps={{
            sx: {
              width: '100%',
              maxHeight: '90vh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              overflowY: 'auto',
            }
          }}
          sx={{
            zIndex: 1500,
            '& .MuiDrawer-paper': {
              boxShadow: 5,
            }
          }}
        >
          {drawer}
        </SwipeableDrawer>
      )}
      
      {/* Navigation drawer - Desktop (unchanged) */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, display: { xs: 'none', md: 'block' } }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: theme.palette.mode === 'light' 
                ? alpha(theme.palette.background.paper, 0.97) 
                : alpha(theme.palette.background.paper, 0.98),
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              boxShadow: '0 0 15px rgba(0,0,0,0.05)',
              overflowX: 'hidden',
              backgroundImage: theme.palette.mode === 'light' 
                ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))' 
                : 'linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05))',
              '& .MuiTypography-root': {
                letterSpacing: '0.01em',
              },
              '& .MuiListItemButton-root': {
                transition: 'all 0.15s ease',
              },
              '& .MuiListItemIcon-root': {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                '& svg': {
                  fontSize: '1.25rem',
                },
              },
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.default,
        }}
      >
        <Toolbar /> {/* Spacing for the app bar */}
        <Box
          sx={{
            p: getContentPadding(isMobile, isSmallMobile),
            flexGrow: 1,
            overflow: 'auto',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {/* Walkthrough tour for new users */}
          {isAuthenticated && <WalkthroughTour />}
          
          {/* Main page content */}
          {children}
        </Box>
      </Box>
    </Box>
  );
}