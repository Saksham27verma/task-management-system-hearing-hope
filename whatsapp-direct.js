#!/usr/bin/env node

/**
 * Direct WhatsApp Message Sender for Hearing Hope
 * 
 * This is a simplified implementation using the legacy Baileys library
 * with minimal dependencies to avoid the buffer-util issues.
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create auth directory
const AUTH_DIR = path.join(__dirname, 'whatsapp_auth');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Queue for pending messages
const messageQueue = [];

// Keep track of connection state
let isConnected = false;
let sock = null;

// Connect to WhatsApp
async function connectToWhatsApp() {
  try {
    console.log('Starting WhatsApp connection...');
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Chrome', 'Windows', '10']
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('\n===== SCAN THIS QR CODE WITH WHATSAPP =====');
        qrcode.generate(qr, { small: false });
        console.log('\nOpen WhatsApp on your phone > Settings > Linked Devices > Link a Device');
      }
      
      if (connection === 'open') {
        console.log('\n✅ CONNECTED TO WHATSAPP!');
        console.log(`Connected as: ${sock.user?.id?.split(':')[0] || 'Unknown'}\n`);
        isConnected = true;
        
        // Process any queued messages
        processQueue();
        
        // Start message mode
        startMessageMode();
      }
      
      if (connection === 'close') {
        isConnected = false;
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`Connection closed due to: ${lastDisconnect?.error?.message || 'Unknown reason'}`);
        
        if (shouldReconnect) {
          console.log('Reconnecting...');
          setTimeout(connectToWhatsApp, 5000);
        } else {
          console.log('Logged out or disconnected permanently. Please restart the service.');
          process.exit(1);
        }
      }
    });
    
    // Listen for messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const m of messages) {
        if (!m.key.fromMe && m.message) {
          const sender = m.key.remoteJid;
          const messageText = m.message.conversation || m.message.extendedTextMessage?.text || '';
          console.log(`\nMessage received from ${sender}: ${messageText}`);
          
          // Auto-reply to ping
          if (messageText.toLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: '🏓 Pong! Hearing Hope WhatsApp service is active.' });
            console.log(`Auto-replied to ping from ${sender}`);
          }
        }
      }
    });
    
    return sock;
  } catch (error) {
    console.error('Error connecting to WhatsApp:', error);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectToWhatsApp, 5000);
  }
}

// Process message queue
async function processQueue() {
  if (!isConnected || !sock || messageQueue.length === 0) return;
  
  console.log(`Processing message queue (${messageQueue.length} messages)`);
  
  while (messageQueue.length > 0 && isConnected) {
    const { to, message } = messageQueue.shift();
    try {
      await sock.sendMessage(to, { text: message });
      console.log(`Message sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send message to ${to}:`, error.message);
      // Put the message back in the queue for temporary errors
      if (error.message !== 'Connection Closed') {
        messageQueue.unshift({ to, message });
      }
    }
  }
}

// Format phone number for WhatsApp
function formatPhoneNumber(phone) {
  // Remove non-digits
  let cleanNumber = phone.replace(/\D/g, '');
  
  // Remove leading 0
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1);
  }
  
  // Add country code if not present (default to India +91)
  if (cleanNumber.length === 10) {
    cleanNumber = `91${cleanNumber}`;
  }
  
  // Return in WhatsApp format
  return `${cleanNumber}@s.whatsapp.net`;
}

// Start interactive message mode
function startMessageMode() {
  console.log('\n=== WhatsApp Message Mode ===');
  console.log('Type a message in the format: NUMBER:MESSAGE');
  console.log('Example: 9811168046:Hello from Hearing Hope');
  console.log('Type "queue" to view the message queue');
  console.log('Type "exit" to quit\n');
  
  rl.on('line', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('Exiting...');
      process.exit(0);
    } else if (input.toLowerCase() === 'queue') {
      console.log(`Message queue (${messageQueue.length} messages):`);
      messageQueue.forEach((item, index) => {
        console.log(`${index + 1}. To: ${item.to} - Message: ${item.message.substring(0, 30)}...`);
      });
    } else if (input.includes(':')) {
      const [phone, ...messageParts] = input.split(':');
      const message = messageParts.join(':'); // In case message contains colons
      
      if (!phone || !message) {
        console.log('Invalid format. Use NUMBER:MESSAGE');
        return;
      }
      
      const recipient = formatPhoneNumber(phone);
      messageQueue.push({ to: recipient, message });
      console.log(`Message queued for ${recipient}`);
      
      // Try to process queue immediately
      if (isConnected) {
        processQueue();
      }
    } else {
      console.log('Invalid command. Use NUMBER:MESSAGE format or type "exit" to quit');
    }
  });
}

// Start the connection
console.log('=== Hearing Hope Direct WhatsApp Messenger ===');
connectToWhatsApp();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
}); 