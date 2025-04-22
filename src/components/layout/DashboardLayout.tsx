import React, { useState, ReactNode } from 'react';
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
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
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

const drawerWidth = 280;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  permissions?: string[];
  roles?: string[];
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  
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
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
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
    <div>
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '16px',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)'
          }
        }}>
          <Image 
            src="/images/logohope.svg" 
            alt="Hearing Hope Logo" 
            width={150} 
            height={50} 
            style={{ 
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)' // Make logo white
            }} 
          />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {filteredNavItems.map((item) => (
          <Permission 
            key={item.href}
            permissions={item.permissions}
            roles={item.roles}
            require="any"
          >
            <ListItem disablePadding>
              <Tooltip 
                title={item.label} 
                placement="right"
                disableHoverListener={!isMobile}
              >
                <Link href={item.href} style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                  <ListItemButton 
                    selected={isActive(item.href)}
                    sx={{
                      transition: 'all 0.2s ease',
                      borderRadius: '4px',
                      mx: 1,
                      my: 0.5,
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateX(4px)'
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(238, 100, 23, 0.2)' 
                          : 'rgba(238, 100, 23, 0.1)',
                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(238, 100, 23, 0.3)' 
                            : 'rgba(238, 100, 23, 0.15)',
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: isActive(item.href) ? theme.palette.primary.main : 'inherit',
                      minWidth: { xs: 36, sm: 42 }
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: isActive(item.href) ? 'medium' : 'normal'
                      }}
                    />
                  </ListItemButton>
                </Link>
              </Tooltip>
            </ListItem>
          </Permission>
        ))}
      </List>
    </div>
  );

  // If not authenticated, return null or redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              display: { md: 'none' },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'rotate(180deg)' }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            <Typography 
              variant="h6" 
              color="textSecondary" 
              sx={{ 
                fontWeight: 'medium',
                opacity: 0.8
              }}
            >
              {/* Dynamic title based on current page */}
              {pathname && pathname.split('/').pop()?.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Dark mode toggle */}
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton
                onClick={toggleTheme}
                color="inherit"
                aria-label="toggle dark mode"
                sx={{ 
                  mr: { xs: 1, sm: 2 },
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'rotate(30deg)',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Add Notification Bell here */}
            <NotificationBell />
            
            <Typography 
              variant="subtitle1" 
              sx={{ 
                display: { xs: 'none', sm: 'block' }, 
                mr: 2,
                fontWeight: 'medium'
              }}
            >
              {user?.name}
            </Typography>
            <IconButton 
              size="large" 
              edge="end" 
              onClick={handleMenuOpen}
              color="inherit"
              sx={{
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: theme.palette.secondary.main,
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  boxShadow: 2
                }}
              >
                {user?.name.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <ProfileIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="sidebar navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Toolbar />
        {children}
        
        {/* Add the walkthrough tour */}
        <WalkthroughTour />
      </Box>
    </Box>
  );
} 