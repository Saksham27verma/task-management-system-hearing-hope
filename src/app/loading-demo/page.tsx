'use client';

import { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  Chip, 
  Container, 
  Divider, 
  FormControl, 
  FormControlLabel, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  SelectChangeEvent, 
  Slider, 
  Stack, 
  Switch, 
  Typography, 
  useTheme
} from '@mui/material';
import Grid from '@mui/material/Grid';
import LoadingScreen from '@/components/common/LoadingScreen';

export default function LoadingDemoPage() {
  const theme = useTheme();
  const [showLoading, setShowLoading] = useState(false);
  const [animationStyle, setAnimationStyle] = useState<'pulse' | 'bounce' | 'rotate' | 'shine' | 'fade'>('pulse');
  const [backgroundEffect, setBackgroundEffect] = useState<'glow' | 'ripple' | 'none'>('glow');
  const [fullScreen, setFullScreen] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [showAppName, setShowAppName] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [logoSize, setLogoSize] = useState({ width: 200, height: 70 });
  const [progressColor, setProgressColor] = useState(theme.palette.primary.main);
  
  const handleShowLoading = (options = {}) => {
    setShowLoading(true);
    setTimeout(() => {
      setShowLoading(false);
    }, 5000);
  };
  
  const presetMessages = [
    "Loading your dashboard...",
    "Getting things ready...",
    "Preparing task data...",
    "Fetching the latest updates...",
    "Almost there..."
  ];

  const presetColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    "#e91e63", // pink
    "#9c27b0", // purple
    "#ff9800", // orange
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {showLoading && (
        <LoadingScreen 
          fullScreen={fullScreen}
          animationStyle={animationStyle}
          showProgress={showProgress}
          showAppName={showAppName}
          message={loadingMessage}
          logoSize={logoSize}
          progressColor={progressColor}
          logoBackgroundEffect={backgroundEffect}
        />
      )}
      
      <Typography variant="h4" gutterBottom>
        Enhanced Loading Screen Demo
      </Typography>
      
      <Typography variant="body1" paragraph sx={{ mb: 4 }}>
        Customize the loading screen with different animations and styles to enhance your branding experience.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }} component="div">
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Customization Options
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }} component="div">
                <FormControl fullWidth>
                  <InputLabel>Animation Style</InputLabel>
                  <Select
                    value={animationStyle}
                    label="Animation Style"
                    onChange={(e) => setAnimationStyle(e.target.value as any)}
                  >
                    <MenuItem value="pulse">Pulse Effect</MenuItem>
                    <MenuItem value="bounce">Bounce Effect</MenuItem>
                    <MenuItem value="rotate">Rotate Effect</MenuItem>
                    <MenuItem value="shine">Shine Effect</MenuItem>
                    <MenuItem value="fade">Fade Effect</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }} component="div">
                <FormControl fullWidth>
                  <InputLabel>Logo Background Effect</InputLabel>
                  <Select
                    value={backgroundEffect}
                    label="Logo Background Effect"
                    onChange={(e) => setBackgroundEffect(e.target.value as any)}
                  >
                    <MenuItem value="glow">Glow Effect</MenuItem>
                    <MenuItem value="ripple">Ripple Effect</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }} component="div">
                <FormControl fullWidth>
                  <InputLabel>Loading Message</InputLabel>
                  <Select
                    value={loadingMessage}
                    label="Loading Message"
                    onChange={(e) => setLoadingMessage(e.target.value)}
                  >
                    {presetMessages.map((msg) => (
                      <MenuItem key={msg} value={msg}>{msg}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }} component="div">
                <FormControl fullWidth>
                  <InputLabel>Progress Color</InputLabel>
                  <Select
                    value={progressColor}
                    label="Progress Color"
                    onChange={(e) => setProgressColor(e.target.value)}
                  >
                    {presetColors.map((color) => (
                      <MenuItem key={color} value={color}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%', 
                              backgroundColor: color,
                              mr: 1,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }} 
                          />
                          {color === theme.palette.primary.main ? 'Primary' : 
                           color === theme.palette.secondary.main ? 'Secondary' :
                           color === theme.palette.success.main ? 'Success' :
                           color === theme.palette.info.main ? 'Info' :
                           color === "#e91e63" ? 'Pink' :
                           color === "#9c27b0" ? 'Purple' : 'Orange'}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12 }} component="div">
                <Typography gutterBottom>Logo Size</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography>Small</Typography>
                  <Slider
                    value={logoSize.width}
                    onChange={(e, newValue) => setLogoSize({
                      width: newValue as number,
                      height: (newValue as number) * 0.35
                    })}
                    min={100}
                    max={300}
                    step={10}
                    marks={[
                      { value: 100, label: '100px' },
                      { value: 200, label: '200px' },
                      { value: 300, label: '300px' }
                    ]}
                  />
                  <Typography>Large</Typography>
                </Stack>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }} component="div">
                <FormControlLabel
                  control={
                    <Switch 
                      checked={fullScreen} 
                      onChange={(e) => setFullScreen(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Full Screen"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }} component="div">
                <FormControlLabel
                  control={
                    <Switch 
                      checked={showProgress} 
                      onChange={(e) => setShowProgress(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show Progress"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }} component="div">
                <FormControlLabel
                  control={
                    <Switch 
                      checked={showAppName} 
                      onChange={(e) => setShowAppName(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show App Name"
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            size="large"
            onClick={() => handleShowLoading()}
            sx={{ height: 54 }}
          >
            Show Loading Screen
          </Button>
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }} component="div">
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Current Configuration
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Animation Style:</Typography>
                <Chip 
                  label={animationStyle.charAt(0).toUpperCase() + animationStyle.slice(1)} 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Background Effect:</Typography>
                <Chip 
                  label={backgroundEffect.charAt(0).toUpperCase() + backgroundEffect.slice(1)} 
                  color="secondary" 
                  variant="outlined"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Loading Message:</Typography>
                <Typography variant="body2" color="text.secondary">
                  "{loadingMessage}"
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Logo Size:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {logoSize.width}px × {logoSize.height}px
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Progress Color:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: progressColor,
                      mr: 1,
                      border: '1px solid rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {progressColor === theme.palette.primary.main ? 'Primary' : 
                     progressColor === theme.palette.secondary.main ? 'Secondary' :
                     progressColor === theme.palette.success.main ? 'Success' :
                     progressColor === theme.palette.info.main ? 'Info' :
                     progressColor === "#e91e63" ? 'Pink' :
                     progressColor === "#9c27b0" ? 'Purple' : 'Orange'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Display Mode:</Typography>
                <Chip 
                  label={fullScreen ? 'Full Screen' : 'Contained'} 
                  color={fullScreen ? 'success' : 'info'} 
                  variant="outlined" 
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Progress Indicator:</Typography>
                <Chip 
                  label={showProgress ? 'Visible' : 'Hidden'} 
                  color={showProgress ? 'success' : 'error'} 
                  variant="outlined" 
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">App Name:</Typography>
                <Chip 
                  label={showAppName ? 'Visible' : 'Hidden'} 
                  color={showAppName ? 'success' : 'error'} 
                  variant="outlined" 
                  size="small"
                />
              </Box>
            </Stack>
            
            <Box sx={{ mt: 4 }}>
              <Card sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Preview Note
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The loading screen will automatically close after 5 seconds. You can try different animation combinations to find the perfect loading experience for your users.
                </Typography>
              </Card>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 