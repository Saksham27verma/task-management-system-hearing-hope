/**
 * WhatsApp URL-based Integration
 * 
 * This module provides an alternative implementation for WhatsApp integration
 * that uses the URL-based approach instead of the API, which has persistent
 * connection issues.
 */

import axios from 'axios';

// Configuration
const WHATSAPP_ENABLED = process.env.ENABLE_WHATSAPP_NOTIFICATIONS === 'true';
const DEFAULT_COUNTRY_CODE = '91'; // India

// Server-side imports (only available in Node.js environment)
let fs: any = null;
let path: any = null;
let qrcode: any = null;

// Check if we're in a Node.js environment
if (typeof window === 'undefined') {
  try {
    fs = require('fs');
    path = require('path');
    qrcode = require('qrcode');
  } catch (error) {
    console.warn('[WhatsApp] Server-side modules not available');
  }
}

/**
 * Format phone number for WhatsApp
 * @param phone Phone number to format
 * @returns Properly formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove non-digit characters
  let formattedNumber = phone.replace(/\D/g, '');
  
  // Remove leading zero if present
  if (formattedNumber.startsWith('0')) {
    formattedNumber = formattedNumber.substring(1);
  }
  
  // Add country code if missing (assuming 10-digit number for India)
  if (formattedNumber.length === 10) {
    formattedNumber = `${DEFAULT_COUNTRY_CODE}${formattedNumber}`;
  }
  
  return formattedNumber;
}

/**
 * Generate a WhatsApp URL for direct messaging
 * @param phone Recipient phone number
 * @returns WhatsApp API URL
 */
export function generateWhatsAppUrl(phone: string): string {
  const formattedNumber = formatPhoneNumber(phone);
  return `https://wa.me/${formattedNumber}`;
}

/**
 * Generate a WhatsApp URL with pre-filled message
 * @param phone Recipient phone number 
 * @param message Message content (will be URL encoded)
 * @returns WhatsApp API URL with message
 */
export function generateWhatsAppUrlWithMessage(phone: string, message: string): string {
  const formattedNumber = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
}

/**
 * Generate a QR code for direct WhatsApp messaging (server-side only)
 * @param phone Recipient phone number
 * @param message Optional message to pre-fill
 * @returns Path to the generated QR code image
 */
export async function generateWhatsAppQR(phone: string, message?: string): Promise<string> {
  // Check if server-side modules are available
  if (!fs || !path || !qrcode) {
    throw new Error('[WhatsApp] QR code generation only available on server-side');
  }
  
  try {
    const formattedNumber = formatPhoneNumber(phone);
    if (!formattedNumber) throw new Error('Invalid phone number');
    
    const QR_DIR = path.join(process.cwd(), 'public', 'whatsapp-qr');
    
    // Ensure QR directory exists
    if (!fs.existsSync(QR_DIR)) {
      fs.mkdirSync(QR_DIR, { recursive: true });
    }
    
    // Create filename based on phone number
    const qrFilename = `whatsapp-${formattedNumber}.png`;
    const qrPath = path.join(QR_DIR, qrFilename);
    const publicPath = `/whatsapp-qr/${qrFilename}`;
    
    // Generate WhatsApp URL
    const whatsappUrl = message 
      ? generateWhatsAppUrlWithMessage(formattedNumber, message)
      : generateWhatsAppUrl(formattedNumber);
    
    // Generate QR code
    await qrcode.toFile(qrPath, whatsappUrl, {
      color: {
        dark: '#128C7E',  // WhatsApp green
        light: '#FFFFFF'
      },
      width: 300,
      margin: 1
    });
    
    return publicPath;
  } catch (error) {
    console.error('[WhatsApp] Error generating QR code:', error);
    throw error;
  }
}

/**
 * Send a WhatsApp message by generating a QR code
 * This is a fallback approach when direct API connection fails
 * @param to Recipient phone number(s)
 * @param message Message content
 * @returns Object with QR code paths
 */
export async function sendWhatsAppMessageViaQR(
  to: string | string[],
  message: string
): Promise<{ success: boolean, qrCodes: { phone: string, qrPath: string }[] }> {
  // Skip if WhatsApp is disabled
  if (!WHATSAPP_ENABLED) {
    console.log('[WhatsApp] Notifications disabled. Would have sent:');
    console.log(`[WhatsApp] To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[WhatsApp] Message: ${message}`);
    return { success: false, qrCodes: [] };
  }
  
  // Convert single recipient to array
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0 || !message) {
    return { success: false, qrCodes: [] };
  }
  
  const qrCodes: { phone: string, qrPath: string }[] = [];
  
  // Only generate QR codes on server-side
  if (typeof window !== 'undefined') {
    console.log('[WhatsApp] QR code generation only available on server-side');
    return { success: false, qrCodes: [] };
  }
  
  // Generate QR codes for each recipient
  for (const recipient of recipients) {
    if (!recipient) continue;
    
    try {
      const formattedNumber = formatPhoneNumber(recipient);
      if (!formattedNumber) continue;
      
      const qrPath = await generateWhatsAppQR(formattedNumber, message);
      qrCodes.push({ phone: formattedNumber, qrPath });
      
      console.log(`[WhatsApp] Generated QR code for ${formattedNumber}`);
    } catch (error) {
      console.error(`[WhatsApp] Error generating QR for ${recipient}:`, error);
    }
  }
  
  return { 
    success: qrCodes.length > 0,
    qrCodes
  };
}

// Export a compatible interface with the original whatsapp.ts
export default {
  sendWhatsAppMessage: sendWhatsAppMessageViaQR,
  formatPhoneNumber,
  generateWhatsAppUrl,
  generateWhatsAppQR
}; 