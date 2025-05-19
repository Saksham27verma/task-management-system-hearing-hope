import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Link,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Videocam as VideoIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

// These would normally be environment variables
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Check if Google API credentials are properly configured
const areCredentialsConfigured = () => {
  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('Google API Key is not properly configured');
    return false;
  }
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
    console.error('Google Client ID is not properly configured');
    return false;
  }
  return true;
};

// Scopes needed for Google Calendar integration (which enables Meet creation)
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';

interface MeetingInfo {
  id: string;
  url: string;
  title: string;
  createdAt: Date;
}

interface GoogleMeetIntegrationProps {
  canCreateMeetings: boolean;
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  organizer: string;
  status: 'upcoming' | 'live' | 'completed';
  meetingUrl: string;
}

// Function to create a "Now" meeting
const createInstantMeeting = async (
  gapiClient: any, 
  title: string = "Instant Meeting", 
  durationMinutes: number = 30
) => {
  if (!gapiClient?.calendar) {
    throw new Error("Google Calendar API not initialized");
  }
  
  // Set start time to now and end time to now + duration
  const now = new Date();
  const later = new Date(now.getTime() + durationMinutes * 60000);
  
  // Create event with conferenceData request
  const event = {
    summary: title,
    start: {
      dateTime: now.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: later.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    conferenceData: {
      createRequest: {
        requestId: `instant-meeting-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    }
  };
  
  // Insert the event
  const response = await gapiClient.calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    resource: event
  });
  
  return response.result;
};

const GoogleMeetIntegration: React.FC<GoogleMeetIntegrationProps> = ({ canCreateMeetings }) => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '',
    duration: 60,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingInstantMeeting, setIsCreatingInstantMeeting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  // Load the Google API client library and authenticate with newer method
  useEffect(() => {
    // First check if credentials are configured
    if (!areCredentialsConfigured()) {
      setAuthError('Google API credentials are not properly configured. Please check your environment variables.');
      return;
    }

    // Load the Google Identity Services script
    const loadGoogleIdentityServices = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleApi();
      };
      script.onerror = () => {
        setAuthError('Failed to load Google Identity Services script. Please check your internet connection.');
      };
      document.body.appendChild(script);
    };

    // Load the gapi script for API calls
    const loadGapiScript = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load('client', () => {
          window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          }).then(() => {
            // Now load Google Identity Services
            loadGoogleIdentityServices();
          }).catch((error: any) => {
            setAuthError(`Error initializing Google API client: ${error.message || JSON.stringify(error)}`);
          });
        });
      };
      script.onerror = () => {
        setAuthError('Failed to load Google API script. Please check your internet connection.');
      };
      document.body.appendChild(script);
    };

    const initGoogleApi = () => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              setIsAuthenticated(true);
              // Set the access token for GAPI
              window.gapi.client.setToken(tokenResponse);
              // Fetch meetings after authentication
              fetchMeetings();
            }
          },
          error_callback: (error: any) => {
            setAuthError(`Authentication error: ${error.type || 'Unknown error'}`);
            setIsAuthenticated(false);
          }
        });
        
        setTokenClient(client);
      } catch (error) {
        setAuthError(`Failed to initialize authentication: ${(error as any)?.message || JSON.stringify(error)}`);
      }
    };

    if (typeof window !== 'undefined') {
      loadGapiScript();
    }

    return () => {
      // Clean up scripts
      document.querySelectorAll('script[src="https://apis.google.com/js/api.js"], script[src="https://accounts.google.com/gsi/client"]')
        .forEach(scriptTag => document.body.removeChild(scriptTag));
    };
  }, []);

  // Handle Google authentication
  const handleGoogleAuth = () => {
    if (!tokenClient) {
      setAuthError('Authentication not initialized. Please refresh the page and try again.');
      return;
    }
    
    if (!isAuthenticated) {
      // Request access token
      tokenClient.requestAccessToken();
    } else {
      // Revoke access token
      if (window.gapi?.client?.getToken()) {
        const token = window.gapi.client.getToken().access_token;
        if (token) {
          fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
            .then(() => {
              window.gapi.client.setToken(null);
              setIsAuthenticated(false);
              setMeetings([]);
            })
            .catch(() => {
              // Handle error silently
              window.gapi.client.setToken(null);
              setIsAuthenticated(false);
              setMeetings([]);
            });
        }
      }
    }
  };

  // Get meeting status based on start and end time
  const getEventStatus = (startDateTime: string, endDateTime: string): 'upcoming' | 'live' | 'completed' => {
    const now = new Date();
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'live';
  };

  // Fetch meetings from Google Calendar API
  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      if (!window.gapi.client.calendar) {
        throw new Error('Google Calendar API not initialized');
      }

      // Get meetings from the calendar API
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString();
        
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
        // Only fetch events with conference data
        q: 'hangoutLink'
      });
        
      const events = response.result.items;
      const googleMeetings = events
        .filter(event => event.conferenceData?.conferenceId)
        .map(event => ({
          id: event.id,
          title: event.summary || 'Untitled Meeting',
          startTime: event.start.dateTime || event.start.date,
          duration: event.end ? 
            (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / 60000 : 
            60,
          organizer: event.organizer?.email || 'Unknown',
          status: getEventStatus(event.start.dateTime, event.end.dateTime),
          meetingUrl: event.conferenceData?.entryPoints[0]?.uri || event.hangoutLink,
        }));
        
      console.log('Fetched meetings:', googleMeetings.length);
      setMeetings(googleMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setNotification({
        message: `Error fetching meetings: ${(error as any)?.message || 'Unknown error'}`,
        type: 'error'
      });
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for opening the dialog
  const handleOpenDialog = () => {
    if (!isAuthenticated) {
      setNotification({
        message: 'Please sign in with Google first to create meetings',
        type: 'error'
      });
      return;
    }
    
    setOpenDialog(true);
    setMeetingTitle('');
    setSelectedMeeting(null);
    
    // Set default date and time (next hour)
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    
    setNewMeeting({
      title: '',
      date: now.toISOString().split('T')[0],
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      duration: 60,
    });
  };
  
  // Handler for closing the dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMeeting(null);
    setNewMeeting({
      title: '',
      date: '',
      time: '',
      duration: 60,
    });
  };
  
  // Handler for creating a new meeting
  const handleCreateMeeting = async () => {
    if (!isAuthenticated || !window.gapi?.client?.calendar) {
      setNotification({
        message: 'You must be signed in to Google to create meetings',
        type: 'error'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Calculate start and end time
      const startDateTime = `${newMeeting.date}T${newMeeting.time}:00`;
      const endTime = new Date(startDateTime);
      endTime.setMinutes(endTime.getMinutes() + newMeeting.duration);
      
      // Create event with conferenceData request
      const event = {
        summary: newMeeting.title,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        conferenceData: {
          createRequest: {
            requestId: `meeting-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };
      
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        resource: event
      });
      
      const createdEvent = response.result;
      
      // Extract Google Meet URL
      const meetingUrl = createdEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || 
                        createdEvent.hangoutLink || '';
      
      if (meetingUrl) {
        const newMeetingObj: Meeting = {
          id: createdEvent.id,
          title: createdEvent.summary || 'Untitled Meeting',
          startTime: createdEvent.start?.dateTime || new Date().toISOString(),
          duration: newMeeting.duration,
          organizer: user?.name || 'Current User',
          status: 'upcoming',
          meetingUrl: meetingUrl,
        };
        
        setMeetings([newMeetingObj, ...meetings]);
        setNotification({
          message: 'Meeting created successfully!',
          type: 'success'
        });
        
        // Open the meeting in a new tab
        window.open(meetingUrl, '_blank');
      } else {
        throw new Error('Could not generate Google Meet link');
      }
      
      handleCloseDialog();
    } catch (error) {
      setNotification({
        message: 'Failed to create meeting. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for copying meeting URL
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopyStatus(prev => ({ ...prev, [url]: true }));
        setTimeout(() => {
          setCopyStatus(prev => ({ ...prev, [url]: false }));
        }, 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Filter meetings based on period
  const getFilteredMeetings = useMemo(() => {
    let filtered = [...meetings];
    
    // Apply date filter
    if (filterPeriod !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (filterPeriod === 'today') {
        filtered = filtered.filter(meeting => new Date(meeting.startTime) >= today);
      } else if (filterPeriod === 'week') {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        filtered = filtered.filter(meeting => new Date(meeting.startTime) >= weekStart);
      } else if (filterPeriod === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        filtered = filtered.filter(meeting => new Date(meeting.startTime) >= monthStart);
      }
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(meeting => 
        meeting.title.toLowerCase().includes(query) || 
        meeting.organizer.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [meetings, filterPeriod, searchQuery]);
  
  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterPeriod(event.target.value as FilterPeriod);
  };

  // Handle copy meeting link
  const handleCopyLink = (meetingUrl: string, id: string) => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Handle deleting a meeting
  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }
    
    if (isAuthenticated && window.gapi?.client?.calendar) {
      setIsLoading(true);
      
      try {
        await window.gapi.client.calendar.events.delete({
          calendarId: 'primary',
          eventId: id
        });
        
        // Remove from local state
        setMeetings(meetings.filter(meeting => meeting.id !== id));
        
        setNotification({
          message: 'Meeting deleted successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting meeting:', error);
        setNotification({
          message: 'Failed to delete meeting',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setNotification({
        message: 'You must be authenticated to delete meetings',
        type: 'error'
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get chip color based on status
  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'primary';
      case 'live':
        return 'success';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Handler for creating an instant meeting
  const handleCreateInstantMeeting = async () => {
    if (!isAuthenticated || !window.gapi?.client?.calendar) {
      setNotification({
        message: 'You must be signed in to Google to create meetings',
        type: 'error'
      });
      return;
    }
    
    setIsCreatingInstantMeeting(true);
    
    try {
      // Create an instant meeting that starts now
      const instantTitle = `Instant Meeting - ${new Date().toLocaleTimeString()}`;
      const createdEvent = await createInstantMeeting(window.gapi.client, instantTitle, 30);
      
      // Extract Google Meet URL
      const meetingUrl = createdEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || 
                         createdEvent.hangoutLink || '';
      
      if (meetingUrl) {
        const newMeetingObj: Meeting = {
          id: createdEvent.id,
          title: createdEvent.summary || 'Instant Meeting',
          startTime: createdEvent.start?.dateTime || new Date().toISOString(),
          duration: 30, // Default 30 minute duration for instant meetings
          organizer: user?.name || 'Current User',
          status: 'live',
          meetingUrl: meetingUrl,
        };
        
        setMeetings([newMeetingObj, ...meetings]);
        setNotification({
          message: 'Instant meeting created! Opening now...',
          type: 'success'
        });
        
        // Open the meeting in a new tab
        window.open(meetingUrl, '_blank');
      } else {
        throw new Error('Could not generate Google Meet link');
      }
    } catch (error) {
      setNotification({
        message: 'Failed to create instant meeting. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCreatingInstantMeeting(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            <VideoIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Google Meet
          </Typography>
          <Box>
            {/* Only show Sign In/Out button if user can create meetings */}
            {canCreateMeetings && (
              <Button
                variant={isAuthenticated ? "outlined" : "contained"}
                color={isAuthenticated ? "secondary" : "primary"}
                onClick={handleGoogleAuth}
                size="small"
                sx={{ mr: 2 }}
              >
                {isAuthenticated ? "Sign Out" : "Sign In with Google"}
              </Button>
            )}
            
            {canCreateMeetings && isAuthenticated && (
              <Box sx={{ display: 'inline-flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={isCreatingInstantMeeting ? <CircularProgress size={16} color="inherit" /> : <VideoIcon />}
                  onClick={handleCreateInstantMeeting}
                  size="small"
                  disabled={isCreatingInstantMeeting}
                >
                  Start Now
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  size="small"
                  data-create-meeting="true"
                >
                  Schedule
                </Button>
              </Box>
            )}
            
            {canCreateMeetings && !isAuthenticated && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                size="small"
                data-create-meeting="true"
                disabled={!isAuthenticated}
              >
                New Meeting
              </Button>
            )}
          </Box>
        </Box>

        {authError && canCreateMeetings && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {authError}
          </Alert>
        )}

        {meetings.length > 0 && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-period-label">
                  <FilterIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Filter Period
                </InputLabel>
                <Select
                  labelId="filter-period-label"
                  value={filterPeriod}
                  label="Filter Period"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Meetings</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {isLoading && meetings.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : meetings.length > 0 ? (
          <>
            {getFilteredMeetings.length > 0 ? (
              <Grid container spacing={2}>
                {getFilteredMeetings.map((meeting) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={meeting.id}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        transition: 'all 0.2s ease',
                        '&:hover': { boxShadow: 3 }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {meeting.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Organizer: {meeting.organizer}
                          </Typography>
                        </Box>
                        <Box>
                          <Tooltip title={copyStatus[meeting.meetingUrl] ? "Copied!" : "Copy link"}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleCopyLink(meeting.meetingUrl, meeting.id)}
                              color={copied === meeting.id ? "success" : "default"}
                              sx={{ mr: 1 }}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Join meeting">
                            <IconButton 
                              size="small"
                              color="primary"
                              onClick={() => window.open(meeting.meetingUrl, '_blank')}
                            >
                              <LaunchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <Chip 
                          label={meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)} 
                          color={getStatusChipColor(meeting.status) as any}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          {formatDate(meeting.startTime)} ({meeting.duration} min)
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        <Link 
                          href={meeting.meetingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          {meeting.meetingUrl}
                        </Link>
                      </Typography>
                      
                      {canCreateMeetings && isAuthenticated && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteMeeting(meeting.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography color="textSecondary">
                  No meetings match your search or filter criteria.
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            {isAuthenticated ? (
              <Typography color="textSecondary">
                {canCreateMeetings 
                  ? "No meetings found. Click \"New Meeting\" to create one."
                  : "No meetings available. Contact an administrator to schedule a meeting."}
              </Typography>
            ) : (
              <Typography color="textSecondary">
                Please sign in with your Google account to access your meetings.
              </Typography>
            )}
          </Box>
        )}
      </Box>
      
      {/* Dialog for creating a new meeting */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Create New Google Meet
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Meeting Title"
                fullWidth
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                margin="normal"
                required
                autoFocus
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Time"
                type="time"
                fullWidth
                value={newMeeting.time}
                onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Duration (minutes)"
                type="number"
                fullWidth
                value={newMeeting.duration}
                onChange={(e) => setNewMeeting({...newMeeting, duration: parseInt(e.target.value)})}
                margin="normal"
                InputProps={{ inputProps: { min: 15, max: 180, step: 15 } }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">
                This will create a Google Calendar event with a Google Meet link attached.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateMeeting} 
            variant="contained" 
            disabled={!newMeeting.title || !newMeeting.date || !newMeeting.time || isLoading}
            startIcon={isLoading && <CircularProgress size={16} />}
            id="create-meeting-button"
          >
            {isLoading ? 'Creating...' : 'Create Meeting'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification */}
      <Snackbar
        open={notification !== null}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification?.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

// Add TypeScript interface for Google Identity Services
declare global {
  interface Window {
    gapi: any;
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
        }
      }
    };
  }
}

export default GoogleMeetIntegration; 