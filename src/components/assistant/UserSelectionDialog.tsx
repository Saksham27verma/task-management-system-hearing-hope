import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { User } from '@/types/User';

interface UserSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  users: User[];
  title?: string;
  loading?: boolean;
}

const UserSelectionDialog: React.FC<UserSelectionDialogProps> = ({
  open,
  onClose,
  onSelect,
  users,
  title = 'Select User for Reminder',
  loading = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'manager': return '#ffc107';
      case 'staff': return '#0d6efd';
      default: return '#6c757d';
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ bgcolor: isDark ? '#1E1E1E' : '#222', color: 'white', pb: 2 }}>
        {title}
        <Typography variant="subtitle2" sx={{ mt: 1, opacity: 0.8 }}>
          {loading ? 'Loading users...' : `${users.length} users available`}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <CircularProgress 
              size={40} 
              thickness={4}
              sx={{ 
                color: '#EE6417',
              }}
            />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No users found
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {users.map((user) => (
              <React.Fragment key={user.id}>
                <ListItem 
                  onClick={() => onSelect(user)}
                  sx={{ 
                    py: 2,
                    borderLeft: `4px solid ${getRoleColor(user.role)}`,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                    },
                    cursor: 'pointer'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getRoleColor(user.role) }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight={500}>
                        {user.name || user.username}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {user.username} • {user.position || user.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSelectionDialog; 