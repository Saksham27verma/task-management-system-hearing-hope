// WhatsApp Notification Bot for Hearing Hope Task Management System
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Boom } = require('@hapi/boom');

// Load environment variables
dotenv.config();

// Custom implementation of buffer utilities to avoid the buggy one
const customMask = function(source, mask, output, offset, length) {
  for (let i = 0; i < length; i++) {
    output[offset + i] = source[offset + i] ^ mask[i & 3];
  }
  return output;
};

// Monkeypatch buffer util mask
try {
  const bufferUtil = require('ws/lib/buffer-util');
  if (bufferUtil && !bufferUtil.mask) {
    bufferUtil.mask = customMask;
  }
} catch (error) {
  console.log('Could not patch buffer-util, may cause errors:', error.message);
}

// Create auth directory if it doesn't exist
const AUTH_DIR = path.join(process.cwd(), 'whatsapp_auth');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Express App Setup
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Create public/qr directory if it doesn't exist
const QR_DIR = path.join(process.cwd(), 'public', 'qr');
if (!fs.existsSync(QR_DIR)) {
  fs.mkdirSync(QR_DIR, { recursive: true });
}

// Create HTTP server
const server = http.createServer(app);

// Store the active socket connection
let waSocket = null;
let socketReady = false;
let connectionQRDisplayed = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;
let connectionStartTime = null;
let lastQRCode = null;

// Configuration
const PORT = process.env.WHATSAPP_BOT_PORT || 3100;
const BOT_PHONE_NUMBER = process.env.WHATSAPP_BOT_NUMBER || '';

// Message queue for when socket is not ready
const messageQueue = [];
const MAX_QUEUE_SIZE = 100;

// Get the socket (for external use)
function getSocket() {
  if (socketReady && waSocket) {
    return waSocket;
  }
  console.log('WhatsApp socket not ready yet');
  return null;
}

// Check if socket is connected and ready
function isSocketReady() {
  return socketReady;
}

// Utility function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

// Format phone number for WhatsApp
function formatPhoneNumber(phone) {
  // Remove any non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Ensure it starts with country code
  if (!cleaned.startsWith('1') && !cleaned.startsWith('91')) {
    cleaned = '91' + cleaned; // Default to India country code
  }
  
  return cleaned;
}

// Send a WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    if (!socketReady || !waSocket) {
      console.log('Socket not ready, queuing message...');
      if (messageQueue.length < MAX_QUEUE_SIZE) {
        messageQueue.push({ to, message });
      }
      return { success: false, error: 'WhatsApp socket not connected' };
    }
    
    // Format the phone number
    const formattedNumber = formatPhoneNumber(to);
    const jid = `${formattedNumber}@s.whatsapp.net`;
    
    // Send the message
    const result = await waSocket.sendMessage(jid, { text: message });
    console.log(`Message sent to ${to}: ${message.substring(0, 20)}...`);
    return { success: true, messageId: result.key.id };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

// Process message queue
async function processMessageQueue() {
  if (messageQueue.length === 0 || !socketReady) return;
  
  console.log(`Processing message queue (${messageQueue.length} messages)...`);
  
  // Take the first 5 messages to process in batch
  const batch = messageQueue.splice(0, 5);
  
  for (const item of batch) {
    try {
      await sendWhatsAppMessage(item.to, item.message);
      // Small delay between messages to avoid flooding
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error processing queued message:', error);
      // Re-queue the message if it failed
      if (messageQueue.length < MAX_QUEUE_SIZE) {
        messageQueue.push(item);
      }
    }
  }
}

// Save QR code to file and generate URL
async function saveQRCode(qrData) {
  try {
    // Use qrcode library to generate an image file
    const qrcode = require('qrcode');
    const qrFilePath = path.join(QR_DIR, 'whatsapp-connect.png');
    const publicPath = '/qr/whatsapp-connect.png';
    
    // Generate QR code and save to file
    await qrcode.toFile(qrFilePath, qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    console.log(`QR code saved to ${qrFilePath}`);
    return publicPath;
  } catch (error) {
    console.error('Error saving QR code:', error);
    return null;
  }
}

// Generate a pairing code instead of QR
async function generatePairingCode(sock) {
  if (!sock) return null;
  
  try {
    // Only generate code if we're not connected
    if (!sock.authState.creds.registered) {
      const phoneNumber = BOT_PHONE_NUMBER.startsWith('+') 
        ? BOT_PHONE_NUMBER.substring(1) 
        : BOT_PHONE_NUMBER;
        
      if (!phoneNumber || phoneNumber === 'YOUR_PHONE_NUMBER_HERE') {
        console.log('⚠️ Please configure your phone number in .env file as WHATSAPP_BOT_NUMBER');
        return null;
      }
      
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(`\n✅ Your WhatsApp pairing code: ${code}\n`);
      console.log('Enter this code in your WhatsApp app: Settings > Linked Devices > Link a Device');
      return code;
    }
  } catch (error) {
    console.error('Error generating pairing code:', error);
  }
  return null;
}

// Main function to start WhatsApp bot
async function startWhatsAppBot() {
  console.log('=== Hearing Hope WhatsApp Notification Bot ===');
  console.log(`Starting WhatsApp bot (attempt ${connectionRetries + 1})...`);
  console.log(`Authentication directory: ${AUTH_DIR}`);
  
  try {
    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    // Fetch the latest version of the WhatsApp web API
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WhatsApp Web version: ${version.join('.')}, isLatest: ${isLatest}`);
    
    // Create socket with updated configuration
    const sock = makeWASocket({
      auth: state,
      browser: ['Hearing Hope TMS', 'Chrome', '103.0'],
      version,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: true,
      markOnlineOnConnect: false, // Don't mark as online to prevent WhatsApp blocking
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        child: () => ({
          level: process.env.LOG_LEVEL || 'info',
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: console.warn,
          error: console.error,
          fatal: console.error
        }),
        trace: () => {},
        debug: () => {},
        info: () => {},
        warn: console.warn,
        error: console.error,
        fatal: console.error
      },
      retryRequestDelayMs: 2500
    });
    
    // Assign the socket to our global variable
    waSocket = sock;
    
    // Generate pairing code if connection is not registered
    setTimeout(async () => {
      if (!socketReady && !connectionQRDisplayed) {
        const pairingCode = await generatePairingCode(sock);
        if (pairingCode) {
          // Update the web interface to show the pairing code
          app.get('/pairing-code', (req, res) => {
            res.json({ code: pairingCode });
          });
        }
      }
    }, 10000); // Wait 10 seconds to allow QR code to appear first if possible
    
    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      // Handle QR code
      if (qr) {
        console.log('\n===== SCAN THIS QR CODE WITH YOUR WHATSAPP =====');
        // Display QR code in terminal
        qrcode.generate(qr, { small: true });
        console.log('\nScan the QR code above with WhatsApp (Linked Devices > Link a Device)');
        connectionQRDisplayed = true;
        lastQRCode = qr;
        
        // Save QR code to a file for web access
        const qrPath = await saveQRCode(qr);
        console.log(`QR code accessible at http://localhost:${PORT}${qrPath}`);
      }
      
      // Handle connection status
      if (connection === 'close') {
        // Get the status code
        const statusCode = lastDisconnect?.error?.output?.statusCode || 0;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log('Connection closed. Status code:', statusCode);
        
        // Handle specific error codes
        if (statusCode === 405) {
          console.log('WhatsApp is blocking this connection attempt.');
          console.log('Try one of the following:');
          console.log('1. Use the pairing code method instead of QR code');
          console.log('2. Connect from a different network');
          console.log('3. Wait for a few hours before trying again');
        }
        
        // Check if we've hit max retries
        if (connectionRetries >= MAX_RETRIES) {
          console.log(`Maximum connection retries (${MAX_RETRIES}) reached. Please restart the bot manually.`);
          socketReady = false;
          return;
        }
        
        // Reconnect if needed
        if (shouldReconnect) {
          connectionRetries++;
          const delay = Math.min(1000 * 2 ** connectionRetries, 60000); // Exponential backoff
          console.log(`Reconnecting in ${delay/1000} seconds...`);
          
          setTimeout(async () => {
            socketReady = false;
            connectionQRDisplayed = false;
            await startWhatsAppBot();
          }, delay);
        } else {
          console.log('WhatsApp logged out. Please restart the bot and scan a new QR code.');
          socketReady = false;
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connection established!');
        socketReady = true;
        connectionRetries = 0;
        connectionStartTime = Date.now();
        
        // Log connection details
        const phoneNumber = sock.user?.id?.split(':')[0] || 'Unknown';
        console.log(`Connected as: ${phoneNumber}`);
        console.log('WhatsApp notification bot is ready to send messages.');
        
        // Start status reporting
        startStatusReporting(sock);
        
        // Process any queued messages
        processMessageQueue();
      }
    });
    
    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);
    
    // Handle message receipts
    sock.ev.on('messages.update', (updates) => {
      for (const update of updates) {
        if (update.status) {
          console.log(`Message ${update.key.id} status: ${update.status}`);
        }
      }
    });
    
    return sock;
  } catch (error) {
    console.error('Error starting WhatsApp bot:', error);
    socketReady = false;
    return null;
  }
}

// Start a status reporter to periodically check health
function startStatusReporting(sock) {
  const startTime = Date.now();
  
  // Report status every minute
  const interval = setInterval(() => {
    if (!socketReady) {
      clearInterval(interval);
      return;
    }
    
    const uptime = (Date.now() - startTime) / 1000;
    console.log(`WhatsApp bot status: CONNECTED (Uptime: ${formatUptime(uptime)})`);
    
    // Process any queued messages
    processMessageQueue();
  }, 60000); // Report every minute
}

// API Endpoints
app.get('/health', (req, res) => {
  const uptime = connectionStartTime ? (Date.now() - connectionStartTime) / 1000 : 0;
  
  res.json({
    status: socketReady ? 'connected' : 'disconnected',
    connected: socketReady,
    uptime: formatUptime(uptime),
    queueSize: messageQueue.length,
    botNumber: BOT_PHONE_NUMBER || 'Not configured',
    qrAvailable: connectionQRDisplayed && !socketReady,
    retryCount: connectionRetries
  });
});

// Endpoint to check QR code status
app.get('/qr-status', (req, res) => {
  res.json({
    qrAvailable: connectionQRDisplayed && !socketReady,
    connected: socketReady,
    lastError: lastQRCode ? null : 'Connection error with WhatsApp servers'
  });
});

app.post('/api/send', async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters: to, message' 
    });
  }
  
  try {
    const result = await sendWhatsAppMessage(to, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notify-task', async (req, res) => {
  const { phone, taskTitle, taskDescription, dueDate, assigneeName, assignerName } = req.body;
  
  if (!phone || !taskTitle) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters' 
    });
  }
  
  try {
    const message = `
*New Task Assigned - Hearing Hope*

Hello ${assigneeName || 'User'},

You have been assigned a new task by ${assignerName || 'Admin'}:

*${taskTitle}*

${taskDescription || 'No description provided'}

Due: ${new Date(dueDate).toLocaleDateString() || 'No due date'}

Please check the Task Management System for more details.`;
    
    const result = await sendWhatsAppMessage(phone, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notify-reminder', async (req, res) => {
  const { phone, taskTitle, assigneeName, timeRemaining } = req.body;
  
  if (!phone || !taskTitle) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters' 
    });
  }
  
  try {
    const message = `
*Task Reminder - Hearing Hope*

Hello ${assigneeName || 'User'},

Your task *${taskTitle}* is due in ${timeRemaining || 'soon'}.

Please complete it as soon as possible.`;
    
    const result = await sendWhatsAppMessage(phone, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notify-admin', async (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters' 
    });
  }
  
  try {
    const formattedMessage = `
*Admin Notification - Hearing Hope*

${message}`;
    
    const result = await sendWhatsAppMessage(phone, formattedMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notify-task-status', async (req, res) => {
  const { phone, taskTitle, previousStatus, newStatus, userName } = req.body;
  
  if (!phone || !taskTitle || !previousStatus || !newStatus) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters' 
    });
  }
  
  try {
    const formattedMessage = `
*Task Status Update - Hearing Hope*

Hello ${userName || 'User'},

The status of task "${taskTitle}" has changed from *${previousStatus}* to *${newStatus}*.

Please check the Task Management System for more details.`;
    
    const result = await sendWhatsAppMessage(phone, formattedMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notify-task-completion', async (req, res) => {
  const { phone, taskTitle, completedBy, completedDate, userName } = req.body;
  
  if (!phone || !taskTitle) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters' 
    });
  }
  
  try {
    const dateStr = completedDate ? new Date(completedDate).toLocaleDateString() : 'today';
    const formattedMessage = `
*Task Completed - Hearing Hope*

Hello ${userName || 'User'},

The task "${taskTitle}" has been marked as complete${completedBy ? ` by ${completedBy}` : ''} on ${dateStr}.

Please check the Task Management System for more details.`;
    
    const result = await sendWhatsAppMessage(phone, formattedMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notify-task-revocation', async (req, res) => {
  const { phone, taskTitle, revokedBy, reason, userName } = req.body;
  
  if (!phone || !taskTitle) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters' 
    });
  }
  
  try {
    const formattedMessage = `
*Task Completion Revoked - Hearing Hope*

Hello ${userName || 'User'},

The completion status of task "${taskTitle}" has been revoked${revokedBy ? ` by ${revokedBy}` : ''}.
${reason ? `\nReason: ${reason}` : ''}

Please check the Task Management System for more details.`;
    
    const result = await sendWhatsAppMessage(phone, formattedMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve QR code page
app.get('/scan', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>WhatsApp QR Code Scanner</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        text-align: center;
      }
      h1 {
        color: #128C7E;
      }
      .qr-container {
        margin: 30px 0;
      }
      .qr-container img {
        max-width: 100%;
        height: auto;
      }
      .instructions {
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: left;
      }
      .status {
        margin-top: 20px;
        padding: 10px;
        border-radius: 4px;
      }
      .connected {
        background-color: #d4edda;
        color: #155724;
      }
      .disconnected {
        background-color: #f8d7da;
        color: #721c24;
      }
      .refresh-btn {
        background-color: #128C7E;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 20px;
      }
      .pairing-code {
        font-size: 24px;
        font-weight: bold;
        margin: 20px 0;
        padding: 15px;
        letter-spacing: 5px;
        background-color: #f0f0f0;
        border-radius: 8px;
        display: none;
      }
      .error-message {
        margin-top: 20px;
        padding: 10px;
        border-radius: 4px;
        background-color: #f8d7da;
        color: #721c24;
        display: none;
      }
      .option-tabs {
        display: flex;
        margin-bottom: 20px;
      }
      .tab {
        flex: 1;
        padding: 10px;
        text-align: center;
        cursor: pointer;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
      }
      .tab.active {
        background-color: #128C7E;
        color: white;
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
    </style>
  </head>
  <body>
    <h1>Hearing Hope WhatsApp Setup</h1>
    
    <div class="option-tabs">
      <div class="tab active" onclick="showTab('qr-tab')">QR Code Method</div>
      <div class="tab" onclick="showTab('pairing-tab')">Pairing Code Method</div>
    </div>
    
    <div id="qr-tab" class="tab-content active">
      <div class="instructions">
        <h3>How to connect with QR Code:</h3>
        <ol>
          <li>Open WhatsApp on your phone</li>
          <li>Go to Settings > Linked Devices</li>
          <li>Tap on "Link a Device"</li>
          <li>Point your phone's camera at the QR code below</li>
        </ol>
      </div>
      
      <div class="qr-container">
        <img src="/qr/whatsapp-connect.png" alt="WhatsApp QR Code" id="qr-code">
      </div>
      
      <div id="qr-error" class="error-message">
        WhatsApp is blocking QR code connections. Please try the Pairing Code method instead.
      </div>
    </div>
    
    <div id="pairing-tab" class="tab-content">
      <div class="instructions">
        <h3>How to connect with Pairing Code:</h3>
        <ol>
          <li>Open WhatsApp on your phone</li>
          <li>Go to Settings > Linked Devices</li>
          <li>Tap on "Link a Device"</li>
          <li>Tap "Link with phone number"</li>
          <li>Enter your phone number (must match the one configured in the bot)</li>
          <li>Enter the pairing code shown below</li>
        </ol>
      </div>
      
      <div id="pairing-code" class="pairing-code">
        Loading...
      </div>
      
      <div id="pairing-error" class="error-message">
        Could not generate pairing code. Make sure your phone number is correctly configured.
      </div>
    </div>
    
    <div id="connection-status" class="status disconnected">
      Waiting for connection...
    </div>
    
    <button class="refresh-btn" onclick="window.location.reload()">Refresh</button>
    
    <script>
      // Check connection status every 5 seconds
      function checkStatus() {
        fetch('/health')
          .then(response => response.json())
          .then(data => {
            const statusDiv = document.getElementById('connection-status');
            
            if (data.connected) {
              statusDiv.className = 'status connected';
              statusDiv.innerHTML = 'Connected to WhatsApp! You can close this page.';
              document.getElementById('qr-code').style.display = 'none';
              document.getElementById('pairing-code').style.display = 'none';
            } else {
              statusDiv.className = 'status disconnected';
              statusDiv.innerHTML = 'Waiting for connection...';
              
              // Show error message if many retries
              if (data.retryCount > 3) {
                document.getElementById('qr-error').style.display = 'block';
                showTab('pairing-tab'); // Switch to pairing tab
              }
            }
          })
          .catch(err => {
            console.error('Error checking status:', err);
          });
          
        // Check if pairing code is available
        fetch('/pairing-code')
          .then(response => response.json())
          .then(data => {
            if (data.code) {
              document.getElementById('pairing-code').textContent = data.code;
              document.getElementById('pairing-code').style.display = 'block';
              document.getElementById('pairing-error').style.display = 'none';
            } else {
              document.getElementById('pairing-error').style.display = 'block';
            }
          })
          .catch(err => {
            document.getElementById('pairing-error').style.display = 'block';
          });
      }
      
      // Show tab
      function showTab(tabId) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Deactivate all tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabId).classList.add('active');
        
        // Activate selected tab button
        document.querySelectorAll('.tab').forEach(tab => {
          if (tab.getAttribute('onclick').includes(tabId)) {
            tab.classList.add('active');
          }
        });
      }
      
      // Check status immediately and then every 5 seconds
      checkStatus();
      setInterval(checkStatus, 5000);
    </script>
  </body>
  </html>
  `);
});

// Starting the HTTP server
server.listen(PORT, () => {
  console.log(`WhatsApp bot HTTP server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/scan to view QR code in browser`);
});

// Starting the WhatsApp connection
(async () => {
  try {
    await startWhatsAppBot();
    
    // Set up a periodic queue processor
    setInterval(processMessageQueue, 15000);
  } catch (error) {
    console.error('Fatal error starting WhatsApp bot:', error);
  }
})();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down WhatsApp bot...');
  if (waSocket) {
    console.log('Closing WhatsApp connection...');
    await waSocket.logout();
  }
  server.close();
  process.exit(0);
});

// Expose functions for external use
module.exports = {
  getSocket,
  isSocketReady,
  startWhatsAppBot,
  sendWhatsAppMessage
}; 