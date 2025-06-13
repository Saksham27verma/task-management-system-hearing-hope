import React from 'react';
import { Box, Typography, Paper, Button, Stack } from '@mui/material';

interface WhatsAppQRCode {
  phone: string;
  qrPath: string;
}

interface WhatsAppNotificationProps {
  qrCodes: WhatsAppQRCode[];
  message: string;
  onClose?: () => void;
}

/**
 * WhatsApp Notification Component
 * Displays QR codes for WhatsApp messaging when direct API connection fails
 */
const WhatsAppNotification: React.FC<WhatsAppNotificationProps> = ({ 
  qrCodes, 
  message,
  onClose 
}) => {
  if (!qrCodes || qrCodes.length === 0) {
    return null;
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        my: 2, 
        border: '1px solid #128C7E', // WhatsApp green
        borderRadius: 2
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: '#128C7E' }}>
        WhatsApp Notification
      </Typography>
      
      <Typography variant="body1" paragraph>
        Direct WhatsApp connection failed. Please scan the QR code(s) below to send message via WhatsApp:
      </Typography>
      
      <Typography 
        variant="body2" 
        paragraph 
        sx={{ 
          bgcolor: '#f5f5f5', 
          p: 2, 
          borderRadius: 1, 
          whiteSpace: 'pre-wrap' 
        }}
      >
        {message}
      </Typography>
      
      <Stack 
        direction="row" 
        spacing={2} 
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 2 }}
      >
        {qrCodes.map((qr, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              border: '1px solid #eee',
              borderRadius: 1,
              minWidth: 240,
              maxWidth: 300,
              mb: 2
            }}
          >
            <Typography variant="body2" gutterBottom>
              +{qr.phone}
            </Typography>
            
            <Box sx={{ width: 200, height: 200, my: 1 }}>
              <img
                src={qr.qrPath}
                alt={`WhatsApp QR for ${qr.phone}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
            
            <Typography variant="caption" color="textSecondary" align="center" gutterBottom>
              1. Open your phone camera<br />
              2. Scan this QR code<br />
              3. Open the WhatsApp link
            </Typography>
            
            <Button 
              variant="outlined" 
              size="small" 
              href={`https://wa.me/${qr.phone}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 1, color: '#128C7E', borderColor: '#128C7E' }}
            >
              Open in WhatsApp
            </Button>
          </Box>
        ))}
      </Stack>
      
      {onClose && (
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button onClick={onClose} variant="text">
            Dismiss
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default WhatsAppNotification; 